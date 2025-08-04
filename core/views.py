from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import serializers
from django.db.models import Q
from django.utils import timezone
from .models import Duel, User, Tournament, TournamentParticipant, TournamentMatch
from .serializers import (DuelSerializer, UserSerializer, UserProfileSerializer, 
                         TournamentSerializer, TournamentParticipantSerializer)
from django.http import JsonResponse
import random
import math

def home(request):
    return JsonResponse({
        "message": "Bienvenue sur l'API PlayInBet",
        "version": "1.0.0",
        "endpoints": {
            "duels": "/duels/",
            "users": "/users/",
            "tournaments": "/tournaments/",
            "auth": "/auth/"
        }
    })

class TournamentViewSet(viewsets.ModelViewSet):
    queryset = Tournament.objects.all().order_by('-created_at')
    serializer_class = TournamentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        status_filter = self.request.query_params.get('status', None)
        game_type = self.request.query_params.get('game_type', None)
        
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if game_type:
            queryset = queryset.filter(game=game_type)
            
        return queryset
    
    @action(detail=True, methods=['post'])
    def register(self, request, pk=None):
        tournament = self.get_object()
        user = request.user
        
        # Vérifications
        if not tournament.can_register:
            return Response(
                {"error": "Les inscriptions sont fermées pour ce tournoi"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if tournament.participants.filter(user=user).exists():
            return Response(
                {"error": "Vous êtes déjà inscrit à ce tournoi"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if user.tickets < tournament.entry_fee:
            return Response(
                {"error": "Tickets insuffisants"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Inscription
        TournamentParticipant.objects.create(tournament=tournament, user=user)
        
        # Déduire les tickets
        user.tickets -= tournament.entry_fee
        user.save()
        
        # Si le tournoi est plein, changer le statut
        if tournament.is_full:
            tournament.status = 'ongoing'
            tournament.save()
            # Générer les matchs du premier tour
            self.generate_first_round_matches(tournament)
        
        return Response({"message": "Inscription réussie"})
    
    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        tournament = self.get_object()
        
        if tournament.status != 'open':
            return Response(
                {"error": "Le tournoi ne peut pas être démarré"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if tournament.current_participants < 2:
            return Response(
                {"error": "Il faut au moins 2 participants"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        tournament.status = 'ongoing'
        tournament.save()
        
        # Générer les matchs
        self.generate_first_round_matches(tournament)
        
        return Response({"message": "Tournoi démarré"})
    
    def generate_first_round_matches(self, tournament):
        """Génère les matchs du premier tour"""
        participants = list(tournament.participants.all())
        random.shuffle(participants)  # Mélange aléatoire
        
        # Pour l'élimination directe
        if tournament.format == 'elimination':
            match_number = 1
            for i in range(0, len(participants), 2):
                if i + 1 < len(participants):
                    TournamentMatch.objects.create(
                        tournament=tournament,
                        round_number=1,
                        match_number=match_number,
                        player1=participants[i].user,
                        player2=participants[i + 1].user,
                        scheduled_time=tournament.start_date
                    )
                    match_number += 1
    
    @action(detail=True, methods=['post'])
    def declare_match_winner(self, request, pk=None):
        tournament = self.get_object()
        match_id = request.data.get('match_id')
        winner_id = request.data.get('winner_id')
        
        try:
            match = tournament.matches.get(id=match_id)
        except TournamentMatch.DoesNotExist:
            return Response(
                {"error": "Match non trouvé"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        if match.winner:
            return Response(
                {"error": "Le vainqueur a déjà été déclaré"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Définir le vainqueur
        if winner_id == str(match.player1.id):
            winner = match.player1
            loser = match.player2
        elif winner_id == str(match.player2.id):
            winner = match.player2
            loser = match.player1
        else:
            return Response(
                {"error": "Le vainqueur doit être l'un des participants"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        match.winner = winner
        match.loser = loser
        match.played_at = timezone.now()
        match.save()
        
        # Mettre à jour les statistiques du vainqueur
        winner.victories += 1
        winner.save()
        
        # Vérifier si le tour est terminé et générer le suivant
        self.check_and_generate_next_round(tournament, match.round_number)
        
        return Response({"message": "Vainqueur déclaré"})
    
    def check_and_generate_next_round(self, tournament, current_round):
        """Vérifie si le tour est terminé et génère le suivant"""
        current_round_matches = tournament.matches.filter(round_number=current_round)
        
        # Si tous les matchs du tour sont terminés
        if all(match.winner for match in current_round_matches):
            winners = [match.winner for match in current_round_matches]
            
            # Si il reste qu'un seul vainqueur, le tournoi est terminé
            if len(winners) == 1:
                tournament.winner = winners[0]
                tournament.status = 'completed'
                tournament.save()
                
                # Récompenser le vainqueur
                winners[0].tickets += tournament.prize_pool
                winners[0].save()
            else:
                # Générer le tour suivant
                self.generate_next_round(tournament, current_round + 1, winners)
    
    def generate_next_round(self, tournament, round_number, winners):
        """Génère les matchs du tour suivant"""
        random.shuffle(winners)
        match_number = 1
        
        for i in range(0, len(winners), 2):
            if i + 1 < len(winners):
                TournamentMatch.objects.create(
                    tournament=tournament,
                    round_number=round_number,
                    match_number=match_number,
                    player1=winners[i],
                    player2=winners[i + 1]
                )
                match_number += 1

class DuelViewSet(viewsets.ModelViewSet):
    queryset = Duel.objects.all().order_by('-created_at')
    serializer_class = DuelSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        game_type = self.request.query_params.get('game_type', None)
        status_filter = self.request.query_params.get('status', None)
        
        if game_type:
            queryset = queryset.filter(game_type=game_type)
        
        if status_filter == 'open':
            queryset = queryset.filter(opponent__isnull=True, winner__isnull=True)
        elif status_filter == 'ongoing':
            queryset = queryset.filter(opponent__isnull=False, winner__isnull=True)
        elif status_filter == 'completed':
            queryset = queryset.filter(winner__isnull=False)
            
        return queryset
    
    def perform_create(self, serializer):
        # Vérifier que l'utilisateur a assez de tickets
        user = self.request.user
        amount_required = serializer.validated_data['amount']
        
        if user.tickets < amount_required:
            raise serializers.ValidationError("Tickets insuffisants")
        
        # Créer le duel
        duel = serializer.save(creator=user)
        
        # Déduire les tickets de l'utilisateur
        user.tickets -= amount_required
        user.save()
    
    @action(detail=True, methods=['post'])
    def join(self, request, pk=None):
        duel = self.get_object()
        user = request.user
        
        # Vérifications
        if duel.opponent:
            return Response(
                {"error": "Ce duel a déjà un adversaire"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if duel.creator == user:
            return Response(
                {"error": "Vous ne pouvez pas rejoindre votre propre duel"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if user.tickets < duel.amount:
            return Response(
                {"error": "Tickets insuffisants"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Rejoindre le duel
        duel.opponent = user
        duel.status = 'in_progress'  # Le duel commence quand quelqu'un le rejoint
        duel.save()
        
        # Déduire les tickets
        user.tickets -= duel.amount
        user.save()
        
        serializer = self.get_serializer(duel)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def ready(self, request, pk=None):
        """Marquer le joueur comme prêt"""
        duel = self.get_object()
        user = request.user
        
        # Vérifications
        if duel.status != 'waiting':
            return Response(
                {"error": "Le duel doit être en attente pour marquer comme prêt"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if user != duel.creator and user != duel.opponent:
            return Response(
                {"error": "Vous ne participez pas à ce duel"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Marquer comme prêt et vérifier si le duel peut commencer
        duel_started = duel.set_player_ready(user)
        
        message = "Vous êtes prêt !"
        if duel_started:
            message = "Duel démarré ! Les deux joueurs sont prêts."
        
        serializer = self.get_serializer(duel)
        return Response({
            "message": message,
            "duel_started": duel_started,
            "duel": serializer.data
        })
    
    @action(detail=True, methods=['delete'])
    def cancel(self, request, pk=None):
        """Annuler un duel - Créateur peut annuler si pas d'adversaire, Admin peut toujours annuler"""
        duel = self.get_object()
        user = request.user
        reason = request.data.get('reason', 'Annulé par l\'utilisateur')
        
        # Vérifications des permissions
        is_creator = duel.creator == user
        is_admin = user.is_staff or user.is_superuser
        
        if not is_creator and not is_admin:
            return Response(
                {"error": "Seul le créateur du duel ou un administrateur peut l'annuler"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Restrictions pour les créateurs (pas pour les admins)
        if is_creator and not is_admin:
            if duel.opponent:
                return Response(
                    {"error": "Impossible d'annuler un duel qui a déjà un adversaire. Contactez un administrateur."}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if duel.status != 'waiting':
                return Response(
                    {"error": "Impossible d'annuler un duel qui n'est pas en attente"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Vérification pour tous : ne pas annuler si déjà terminé
        if duel.status in ['completed', 'expired']:
            return Response(
                {"error": "Ce duel ne peut pas être annulé car il est déjà terminé"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Rembourser les participants
        duel.creator.tickets += duel.amount
        duel.creator.save()
        
        if duel.opponent:
            duel.opponent.tickets += duel.amount
            duel.opponent.save()
        
        # Si c'est un admin qui annule, marquer avec les détails admin
        if is_admin:
            duel.status = 'cancelled'
            duel.admin_resolution = True
            duel.admin_reason = reason
            duel.resolved_by = user
            duel.resolved_at = timezone.now()
            duel.save()
            
            return Response({
                "message": "Duel annulé par l'administrateur. Tous les participants ont été remboursés.",
                "data": DuelSerializer(duel).data
            })
        else:
            # Supprimer le duel si c'est le créateur (ancien comportement)
            duel.delete()
            
            return Response({
                "message": "Duel annulé avec succès. Vos tickets ont été remboursés."
            })
    
    @action(detail=True, methods=['patch'])
    def modify(self, request, pk=None):
        """Modifier un duel (seulement par le créateur et seulement si personne ne l'a rejoint)"""
        duel = self.get_object()
        user = request.user
        
        # Vérifications
        if duel.creator != user:
            return Response(
                {"error": "Seul le créateur du duel peut le modifier"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        if duel.opponent:
            return Response(
                {"error": "Impossible de modifier un duel qui a déjà un adversaire"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if duel.status != 'waiting':
            return Response(
                {"error": "Impossible de modifier un duel qui n'est pas en attente"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Récupérer les nouvelles données
        new_amount = request.data.get('amount')
        new_game_type = request.data.get('game_type')
        new_description = request.data.get('description')
        
        if new_amount is not None:
            try:
                new_amount = float(new_amount)
                if new_amount <= 0:
                    return Response(
                        {"error": "Le montant doit être positif"}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Calculer la différence de tickets
                amount_diff = new_amount - duel.amount
                
                if amount_diff > 0:  # Augmentation du montant
                    if user.tickets < amount_diff:
                        return Response(
                            {"error": f"Tickets insuffisants. Vous avez besoin de {amount_diff} tickets supplémentaires"}, 
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    user.tickets -= amount_diff
                else:  # Diminution du montant
                    user.tickets += abs(amount_diff)
                
                duel.amount = new_amount
                user.save()
                
            except (ValueError, TypeError):
                return Response(
                    {"error": "Montant invalide"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        if new_game_type is not None:
            duel.game_type = new_game_type
        
        if new_description is not None:
            duel.description = new_description
        
        duel.save()
        
        serializer = self.get_serializer(duel)
        return Response({
            "message": "Duel modifié avec succès",
            "duel": serializer.data
        })
    
    @action(detail=True, methods=['patch'])
    def claim_victory(self, request, pk=None):
        """Nouvelle méthode pour déclarer sa propre victoire"""
        duel = self.get_object()
        user = request.user
        
        # Vérifications de base
        if user not in [duel.creator, duel.opponent]:
            return Response(
                {"error": "Seuls les participants peuvent déclarer victoire"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        if not duel.opponent:
            return Response(
                {"error": "Le duel n'a pas encore d'adversaire"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if duel.winner or duel.status == 'completed':
            return Response(
                {"error": "Le duel est déjà terminé"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Vérifier que le duel est en cours
        if duel.status not in ['in_progress', 'waiting']:
            return Response(
                {"error": f"Le duel doit être en cours ou en attente. Statut actuel: {duel.status}"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Vérifier expiration
        if duel.is_expired():
            duel.status = 'expired'
            duel.save()
            return Response(
                {"error": "Le temps pour jouer ce duel est écoulé"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Enregistrer la déclaration de victoire
        if user == duel.creator:
            duel.creator_action = 'victory'
        else:  # user == duel.opponent
            duel.opponent_action = 'victory'
        
        # Essayer de résoudre automatiquement le duel
        if duel.resolve_duel():
            # Duel résolu automatiquement
            return Response({
                "message": f"Félicitations {duel.winner.username} ! Vous avez remporté le duel !",
                "status": "completed",
                "data": self.get_serializer(duel).data
            })
        else:
            # Duel en attente ou en conflit
            duel.save()
            
            if duel.status == 'disputed':
                return Response({
                    "message": "Conflit détecté ! Les deux joueurs revendiquent la victoire. Un admin va examiner les preuves.",
                    "status": "disputed",
                    "data": self.get_serializer(duel).data
                })
            else:
                return Response({
                    "message": "Votre victoire a été enregistrée. En attente de la réaction de votre adversaire.",
                    "status": duel.status,
                    "data": self.get_serializer(duel).data
                })
    
    @action(detail=True, methods=['post'])
    def upload_proof(self, request, pk=None):
        """Upload de preuve visuelle (screenshot du score)"""
        duel = self.get_object()
        user = request.user
        proof_image = request.FILES.get('proof')
        
        if not proof_image:
            return Response(
                {"error": "Aucune image fournie"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if user == duel.creator:
            duel.creator_proof = proof_image
        elif user == duel.opponent:
            duel.opponent_proof = proof_image
        else:
            return Response(
                {"error": "Vous n'êtes pas participant à ce duel"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        duel.save()
        return Response({
            "message": "Preuve uploadée avec succès",
            "data": self.get_serializer(duel).data
        })
    
    @action(detail=True, methods=['patch'])
    def forfeit(self, request, pk=None):
        """Déclarer forfait (abandon du duel)"""
        duel = self.get_object()
        user = request.user
        
        # Vérifications de base
        if user not in [duel.creator, duel.opponent]:
            return Response(
                {"error": "Seuls les participants peuvent déclarer forfait"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        if not duel.opponent:
            return Response(
                {"error": "Le duel n'a pas encore d'adversaire"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if duel.winner or duel.status == 'completed':
            return Response(
                {"error": "Le duel est déjà terminé"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Vérifier que le duel est en cours
        if duel.status not in ['in_progress', 'waiting']:
            return Response(
                {"error": f"Le duel doit être en cours ou en attente. Statut actuel: {duel.status}"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Forfait = l'adversaire gagne automatiquement
        if user == duel.creator:
            duel.winner = duel.opponent
            loser = duel.creator
        else:
            duel.winner = duel.creator
            loser = user
        
        duel.status = 'completed'
        duel.completed_at = timezone.now()
        duel.save()
        
        # Récompenser le vainqueur et pénaliser le perdant
        winner = duel.winner
        winner.tickets += duel.amount * 2  # Gagne le double de la mise
        winner.victories += 1
        self.update_user_rank(winner)
        winner.save()
        
        # Le perdant ne récupère pas sa mise
        loser.defeats += 1
        self.update_user_rank(loser)
        loser.save()
        
        return Response({
            "message": f"{user.username} a déclaré forfait. {winner.username} remporte le duel !",
            "status": "completed",
            "winner": winner.username,
            "data": self.get_serializer(duel).data
        })
    
    @action(detail=True, methods=['patch'])
    def admit_defeat(self, request, pk=None):
        """Admettre sa défaite"""
        duel = self.get_object()
        user = request.user
        
        # Vérifications de base
        if user not in [duel.creator, duel.opponent]:
            return Response(
                {"error": "Seuls les participants peuvent admettre leur défaite"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        if not duel.opponent:
            return Response(
                {"error": "Le duel n'a pas encore d'adversaire"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if duel.winner or duel.status == 'completed':
            return Response(
                {"error": "Le duel est déjà terminé"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Vérifier que le duel est en cours
        if duel.status not in ['in_progress', 'waiting']:
            return Response(
                {"error": f"Le duel doit être en cours ou en attente. Statut actuel: {duel.status}"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Défaite admise = l'adversaire gagne automatiquement
        if user == duel.creator:
            duel.winner = duel.opponent
        else:
            duel.winner = duel.creator
        
        duel.status = 'completed'
        duel.completed_at = timezone.now()
        duel.save()
        
        # Récompenser le vainqueur
        winner = duel.winner
        winner.tickets += duel.amount * 2  # Gagne le double de la mise
        winner.victories += 1
        self.update_user_rank(winner)
        winner.save()
        
        # Mettre à jour les stats du perdant
        user.defeats += 1
        self.update_user_rank(user)
        user.save()
        
        return Response({
            "message": f"{user.username} a admis sa défaite. {winner.username} remporte le duel !",
            "status": "completed",
            "winner": winner.username,
            "data": self.get_serializer(duel).data
        })
    
    @action(detail=True, methods=['patch'])
    def confirm_result(self, request, pk=None):
        """Confirmer le résultat déclaré par l'adversaire"""
        duel = self.get_object()
        user = request.user
        
        if user not in [duel.creator, duel.opponent]:
            return Response(
                {"error": "Seuls les participants peuvent confirmer"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        if duel.status != 'waiting_proof':
            return Response(
                {"error": "Rien à confirmer"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Déterminer qui a fait la déclaration initiale
        if duel.creator_claim and not duel.opponent_claim:
            # Creator a déclaré, opponent confirme
            if user == duel.opponent:
                duel.opponent_claim = duel.creator_claim
                duel.winner = duel.creator_claim
            else:
                return Response({"error": "Vous avez déjà fait votre déclaration"})
        elif duel.opponent_claim and not duel.creator_claim:
            # Opponent a déclaré, creator confirme
            if user == duel.creator:
                duel.creator_claim = duel.opponent_claim
                duel.winner = duel.opponent_claim
            else:
                return Response({"error": "Vous avez déjà fait votre déclaration"})
        
        duel.status = 'completed'
        duel.resolved_at = timezone.now()
        duel.save()
        
        # Récompenser le vainqueur
        winner = duel.winner
        winner.tickets += duel.tickets * 2
        winner.victories += 1
        self.update_user_rank(winner)
        winner.save()
        
        return Response({
            "message": f"Résultat confirmé ! {winner.username} remporte le duel !",
            "data": self.get_serializer(duel).data
        })
    
    def update_user_rank(self, user):
        """Met à jour le rang d'un utilisateur selon ses victoires"""
        if user.victories >= 50:
            user.rank = "Légende"
        elif user.victories >= 20:
            user.rank = "Expert"
        elif user.victories >= 10:
            user.rank = "Confirmé"
        elif user.victories >= 5:
            user.rank = "Intermédiaire"
        else:
            user.rank = "Débutant"
    
    @action(detail=True, methods=['patch'])
    def declare_winner(self, request, pk=None):
        """DEPRECATED: Ancienne méthode gardée pour compatibilité"""
        # Rediriger vers claim_victory pour l'instant
        return self.claim_victory(request, pk)

class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all().order_by('-victories', '-tickets')
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def leaderboard(self, request):
        sort_by = request.query_params.get('sort_by', 'victories')
        
        if sort_by == 'tickets':
            queryset = User.objects.all().order_by('-tickets', '-victories')
        else:
            queryset = User.objects.all().order_by('-victories', '-tickets')
        
        serializer = UserProfileSerializer(queryset[:100], many=True)  # Top 100
        return Response(serializer.data)