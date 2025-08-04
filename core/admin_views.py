from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import Duel, User
from .serializers import DuelSerializer

class AdminDuelViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet pour la gestion admin des duels"""
    queryset = Duel.objects.all().order_by('-created_at')
    serializer_class = DuelSerializer
    permission_classes = [IsAdminUser]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        status_filter = self.request.query_params.get('status', None)
        
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset
    
    @action(detail=True, methods=['patch'])
    def resolve_dispute(self, request, pk=None):
        """Résoudre un litige en faveur d'un joueur"""
        duel = self.get_object()
        winner_id = request.data.get('winner_id')
        admin_reason = request.data.get('admin_reason', '')
        
        if duel.status != 'disputed':
            return Response(
                {"error": "Ce duel n'est pas en litige"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Déterminer le vainqueur
        if winner_id == str(duel.creator.id):
            winner = duel.creator
        elif winner_id == str(duel.opponent.id):
            winner = duel.opponent
        else:
            return Response(
                {"error": "Vainqueur invalide"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Résoudre le duel
        duel.winner = winner
        duel.status = 'completed'
        duel.admin_resolution = True
        duel.admin_reason = admin_reason or f"Résolu par admin en faveur de {winner.username}"
        duel.resolved_by = request.user
        duel.resolved_at = timezone.now()
        duel.completed_at = timezone.now()
        duel._distribute_rewards()
        duel.save()
        
        return Response({
            "message": f"Litige résolu en faveur de {winner.username}",
            "data": self.get_serializer(duel).data
        })
    
    @action(detail=True, methods=['patch'])
    def cancel_duel(self, request, pk=None):
        """Annuler un duel et rembourser les participants - Admin uniquement via cette route"""
        duel = self.get_object()
        reason = request.data.get('reason', 'Annulé par un administrateur')
        
        if duel.status in ['completed', 'expired']:
            return Response(
                {"error": "Ce duel ne peut pas être annulé"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Rembourser les participants
        duel.creator.tickets += duel.amount
        duel.creator.save()
        
        if duel.opponent:
            duel.opponent.tickets += duel.amount
            duel.opponent.save()
        
        # Marquer comme annulé
        duel.status = 'cancelled'
        duel.admin_resolution = True
        duel.admin_reason = reason
        duel.resolved_by = request.user
        duel.resolved_at = timezone.now()
        duel.save()
        
        return Response({
            "message": "Duel annulé et participants remboursés",
            "data": self.get_serializer(duel).data
        })
    
    @action(detail=False, methods=['get'])
    def disputes(self, request):
        """Liste tous les duels en litige"""
        disputed_duels = self.queryset.filter(status='disputed')
        serializer = self.get_serializer(disputed_duels, many=True)
        return Response({
            "count": disputed_duels.count(),
            "results": serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Statistiques pour le dashboard admin"""
        from django.db.models import Count
        
        stats = {
            "total_duels": self.queryset.count(),
            "by_status": dict(
                self.queryset.values('status').annotate(count=Count('status')).values_list('status', 'count')
            ),
            "disputes_pending": self.queryset.filter(status='disputed').count(),
            "expired_duels": self.queryset.filter(status='expired').count(),
        }
        
        return Response(stats)
