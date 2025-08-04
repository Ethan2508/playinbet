from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone

class User(AbstractUser):
    USER_ROLES = [
        ('user', 'Utilisateur'),
        ('admin', 'Administrateur'),
        ('super_admin', 'Super Administrateur'),
    ]
    
    VERIFICATION_STATUS = [
        ('pending', 'En attente'),
        ('verified', 'Vérifié'),
        ('rejected', 'Rejeté'),
    ]
    
    tickets = models.PositiveIntegerField(default=100)
    victories = models.PositiveIntegerField(default=0)
    rank = models.CharField(max_length=50, default="Débutant")
    role = models.CharField(max_length=20, choices=USER_ROLES, default='user')
    
    # Vérification KYC
    is_verified = models.BooleanField(default=False, verbose_name="Compte vérifié")
    verification_status = models.CharField(max_length=20, choices=VERIFICATION_STATUS, default='pending')
    verification_submitted_at = models.DateTimeField(null=True, blank=True)
    verification_completed_at = models.DateTimeField(null=True, blank=True)
    
    # Informations KYC
    first_name_kyc = models.CharField(max_length=50, blank=True, verbose_name="Prénom (KYC)")
    last_name_kyc = models.CharField(max_length=50, blank=True, verbose_name="Nom (KYC)")
    date_of_birth = models.DateField(null=True, blank=True, verbose_name="Date de naissance")
    nationality = models.CharField(max_length=50, blank=True, verbose_name="Nationalité")
    address = models.TextField(blank=True, verbose_name="Adresse complète")
    city = models.CharField(max_length=100, blank=True, verbose_name="Ville")
    postal_code = models.CharField(max_length=20, blank=True, verbose_name="Code postal")
    country = models.CharField(max_length=50, blank=True, verbose_name="Pays")
    phone_number = models.CharField(max_length=20, blank=True, verbose_name="Numéro de téléphone")
    
    # Documents KYC
    identity_document = models.CharField(max_length=255, blank=True, verbose_name="Pièce d'identité (simulé)")
    proof_of_address = models.CharField(max_length=255, blank=True, verbose_name="Justificatif de domicile (simulé)")
    
    # Informations bancaires (maintenant obligatoires pour la vérification)
    bank_name = models.CharField(max_length=100, blank=True, verbose_name="Nom de la banque")
    bank_account_holder = models.CharField(max_length=100, blank=True, null=True, verbose_name="Titulaire du compte")
    iban = models.CharField(max_length=34, blank=True, null=True, verbose_name="IBAN")
    bank_iban = models.CharField(max_length=34, blank=True, null=True, verbose_name="IBAN")
    bic = models.CharField(max_length=11, blank=True, null=True, verbose_name="BIC/SWIFT")
    bank_bic = models.CharField(max_length=11, blank=True, null=True, verbose_name="BIC/SWIFT")
    
    # Notes admin pour la vérification
    verification_notes = models.TextField(blank=True, verbose_name="Notes de vérification (admin)")
    
    def is_admin(self):
        return self.role in ['admin', 'super_admin']
    
    def is_super_admin(self):
        return self.role == 'super_admin'
    
    def can_play(self):
        """Vérifie si l'utilisateur peut jouer (compte vérifié)"""
        return self.is_verified
    
    def can_withdraw(self):
        """Vérifie si l'utilisateur peut retirer de l'argent"""
        return self.is_verified and self.bank_iban and self.bank_bic
    
    def get_withdrawal_eligible_amount(self):
        """Montant en euros disponible pour le retrait (1€ = 10 tickets)"""
        return self.tickets // 10 if self.can_withdraw() else 0
    
    def get_tickets_equivalent_euros(self, euros):
        """Convertit des euros en tickets (1€ = 10 tickets)"""
        return euros * 10

class Duel(models.Model):
    GAME_CHOICES = [
        # 🏆 Sport
        ('match_foot', 'Match de Foot'),
        ('penalty_shootout', 'Tirs au But'),
        ('ultimate_team', 'Ultimate Team'),
        ('freestyle', 'Freestyle'),
        
        # 🎮 Compétition
        ('build_fight', 'Build Fight'),
        ('box_fight', 'Box Fight'),
        ('zone_wars', 'Zone Wars'),
        ('1v1_sniper', 'Sniper 1v1'),
        ('tir_precis', 'Tir de Précision'),
        ('combat_rapide', 'Combat Rapide'),
        ('gunfight', 'Gunfight'),
        
        # 🚗 Course
        ('course_aerienne', 'Course Aérienne'),
        ('dribble_challenge', 'Dribble Challenge'),
        
        # 🎯 Défis
        ('defi_aim', 'Défi Aim'),
        ('clutch_1v1', 'Clutch 1v1'),
        ('headshot_only', 'Headshot Only'),
        ('knife_fight', 'Knife Fight'),
        ('quick_scope', 'Quick Scope'),
        ('trick_shot', 'Trick Shot'),
        ('speedrun', 'Speedrun'),
        ('survival', 'Survival'),
        ('deathrun', 'Deathrun'),
        ('parkour', 'Parkour'),
    ]
    
    STATUS_CHOICES = [
        ('open', 'Ouvert'),
        ('waiting', 'En attente du second joueur'),
        ('active', 'Duel en cours'),
        ('upload_proof', 'Upload de preuves'),
        ('ai_validation', 'Validation IA'),
        ('waiting_confirmation', 'En attente de confirmation'),
        ('disputed', 'Litige'),
        ('completed', 'Terminé'),
        ('expired', 'Expiré'),
    ]
    
    # Joueurs
    creator = models.ForeignKey(User, related_name="created_duels", on_delete=models.CASCADE)
    opponent = models.ForeignKey(User, null=True, blank=True, related_name="joined_duels", on_delete=models.SET_NULL)
    
    # Configuration du duel
    game_type = models.CharField(max_length=30, choices=GAME_CHOICES)
    amount = models.PositiveIntegerField()  # Tickets misés par joueur
    duration_minutes = models.PositiveIntegerField(default=10)  # Durée du duel
    
    # État du duel
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='open')
    winner = models.ForeignKey(User, null=True, blank=True, related_name="won_duels", on_delete=models.SET_NULL)
    
    # Statut de préparation des joueurs
    creator_ready = models.BooleanField(default=False)
    opponent_ready = models.BooleanField(default=False)
    
    # Actions des joueurs
    creator_action = models.CharField(max_length=20, null=True, blank=True)  # victory, defeat, forfeit
    opponent_action = models.CharField(max_length=20, null=True, blank=True)
    
    # Preuves et validation IA
    creator_screenshot = models.ImageField(upload_to='duel_screenshots/', null=True, blank=True)
    opponent_screenshot = models.ImageField(upload_to='duel_screenshots/', null=True, blank=True)
    
    # Validation IA
    ai_validation_result = models.JSONField(null=True, blank=True)  # Résultat de l'IA
    ai_confidence = models.FloatField(null=True, blank=True)
    ai_detected_score = models.JSONField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)  # Quand les 2 joueurs sont prêts
    expires_at = models.DateTimeField(null=True, blank=True)  # Fin du temps imparti
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Gestion admin des litiges
    admin_resolution = models.BooleanField(default=False)  # Résolu par un admin
    admin_reason = models.TextField(null=True, blank=True)  # Raison de la résolution admin
    resolved_by = models.ForeignKey(User, null=True, blank=True, related_name="resolved_duels", on_delete=models.SET_NULL)
    resolved_at = models.DateTimeField(null=True, blank=True)
    
    # Système de revanche
    rematch_requested_by = models.ForeignKey(User, null=True, blank=True, related_name="rematch_requests", on_delete=models.SET_NULL)
    original_duel = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL)
    
    def save(self, *args, **kwargs):
        # Auto-démarrage quand l'adversaire rejoint
        if self.opponent and not self.started_at and self.status == 'open':
            self.started_at = timezone.now()
            self.expires_at = timezone.now() + timezone.timedelta(minutes=self.duration_minutes)
            self.status = 'active'
        super().save(*args, **kwargs)
    
    def is_expired(self):
        return self.expires_at and timezone.now() > self.expires_at
    
    def time_remaining(self):
        if not self.expires_at:
            return 0
        remaining = (self.expires_at - timezone.now()).total_seconds()
        return max(0, int(remaining))
    
    def can_join(self, user):
        return (self.status == 'open' and 
                not self.opponent and 
                self.creator != user and
                user.tickets >= self.amount)
    
    def check_ready_status(self):
        """Vérifie si les deux joueurs sont prêts et démarre le duel"""
        if (self.status == 'waiting' and 
            self.opponent and 
            self.creator_ready and 
            self.opponent_ready):
            self.status = 'active'
            self.started_at = timezone.now()
            self.expires_at = timezone.now() + timezone.timedelta(minutes=self.duration_minutes)
            self.save()
            return True
        return False
    
    def set_player_ready(self, user):
        """Marque un joueur comme prêt"""
        if user == self.creator:
            self.creator_ready = True
        elif user == self.opponent:
            self.opponent_ready = True
        self.save()
        return self.check_ready_status()
    
    @property
    def both_players_ready(self):
        return self.creator_ready and self.opponent_ready
    
    @property 
    def time_elapsed(self):
        """Temps écoulé depuis le début du duel en secondes"""
        if not self.started_at:
            return 0
        elapsed = (timezone.now() - self.started_at).total_seconds()
        return max(0, int(elapsed))
    
    def resolve_duel(self):
        """Résolution automatique basée sur les actions des joueurs"""
        if self.creator_action and self.opponent_action:
            # Les deux ont déclaré - vérifier cohérence
            if ((self.creator_action == 'victory' and self.opponent_action == 'defeat') or
                (self.creator_action == 'defeat' and self.opponent_action == 'victory')):
                # Cohérent - détermine le gagnant
                self.winner = self.creator if self.creator_action == 'victory' else self.opponent
                self.status = 'completed'
                self.completed_at = timezone.now()
                self._distribute_rewards()
                return True
            else:
                # Incohérent - aller en validation IA ou litige
                self.status = 'ai_validation' if (self.creator_screenshot or self.opponent_screenshot) else 'disputed'
                return False
        elif self.creator_action == 'forfeit':
            self.winner = self.opponent
            self.status = 'completed'
            self.completed_at = timezone.now()
            self._distribute_rewards()
            return True
        elif self.opponent_action == 'forfeit':
            self.winner = self.creator
            self.status = 'completed'
            self.completed_at = timezone.now()
            self._distribute_rewards()
            return True
        
        return False
    
    def _distribute_rewards(self):
        """Distribution des tickets"""
        if self.winner:
            total_pot = self.amount * 2
            self.winner.tickets += total_pot
            self.winner.victories += 1
            self.winner.save()
            
            # Le perdant perd ses tickets (déjà déduits à la création)
            loser = self.opponent if self.winner == self.creator else self.creator
            # Mise à jour du rang si nécessaire
            self._update_ranks()
    
    def _update_ranks(self):
        """Mise à jour des rangs basée sur les victoires"""
        ranks = [
            (0, 'Débutant'),
            (5, 'Amateur'),
            (15, 'Confirmé'),
            (30, 'Expert'),
            (50, 'Maître'),
            (100, 'Légende')
        ]
        
        for user in [self.creator, self.opponent]:
            if user:
                for min_victories, rank in reversed(ranks):
                    if user.victories >= min_victories:
                        user.rank = rank
                        user.save()
                        break
    
    def get_category_display(self):
        """Retourne la catégorie avec icône"""
        sport_games = ['match_foot', 'penalty_shootout', 'ultimate_team', 'freestyle']
        competition_games = ['build_fight', 'box_fight', 'zone_wars', '1v1_sniper', 'tir_precis', 'combat_rapide', 'gunfight']
        racing_games = ['course_aerienne', 'dribble_challenge']
        challenge_games = ['defi_aim', 'clutch_1v1', 'headshot_only', 'knife_fight', 'quick_scope', 'trick_shot', 'speedrun', 'survival', 'deathrun', 'parkour']
        
        if self.game_type in sport_games:
            return '🏆 Sport'
        elif self.game_type in competition_games:
            return '🎮 Compétition'
        elif self.game_type in racing_games:
            return '🚗 Course'
        elif self.game_type in challenge_games:
            return '🎯 Défis'
        return '🎮 Autre'
    
    def __str__(self):
        return f"{self.get_game_type_display()} - {self.creator.username} vs {self.opponent.username if self.opponent else 'À venir'}"

class Tournament(models.Model):
    STATUS_CHOICES = [
        ('upcoming', 'À venir'),
        ('open', 'Inscriptions ouvertes'),
        ('ongoing', 'En cours'),
        ('completed', 'Terminé'),
        ('cancelled', 'Annulé'),
    ]
    
    FORMAT_CHOICES = [
        ('elimination', 'Élimination directe'),
        ('round_robin', 'Round Robin'),
        ('swiss', 'Système Suisse'),
    ]
    
    name = models.CharField(max_length=200)
    description = models.TextField()
    game = models.CharField(max_length=20, choices=Duel.GAME_CHOICES)
    entry_fee = models.PositiveIntegerField()
    prize_pool = models.PositiveIntegerField()
    max_participants = models.PositiveIntegerField()
    format = models.CharField(max_length=20, choices=FORMAT_CHOICES, default='elimination')
    
    # Dates
    registration_start = models.DateTimeField(default=timezone.now)
    registration_end = models.DateTimeField()
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='upcoming')
    winner = models.ForeignKey(User, null=True, blank=True, related_name="won_tournaments", on_delete=models.SET_NULL)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.name} ({self.game})"
    
    @property
    def current_participants(self):
        return self.participants.count()
    
    @property
    def is_full(self):
        return self.current_participants >= self.max_participants
    
    @property
    def can_register(self):
        now = timezone.now()
        return (self.status == 'open' and 
                self.registration_start <= now <= self.registration_end and
                not self.is_full)

class TournamentParticipant(models.Model):
    tournament = models.ForeignKey(Tournament, related_name="participants", on_delete=models.CASCADE)
    user = models.ForeignKey(User, related_name="tournament_participations", on_delete=models.CASCADE)
    registered_at = models.DateTimeField(auto_now_add=True)
    eliminated_at = models.DateTimeField(null=True, blank=True)
    final_position = models.PositiveIntegerField(null=True, blank=True)
    
    class Meta:
        unique_together = ['tournament', 'user']
    
    def __str__(self):
        return f"{self.user.username} in {self.tournament.name}"

class TournamentMatch(models.Model):
    tournament = models.ForeignKey(Tournament, related_name="matches", on_delete=models.CASCADE)
    round_number = models.PositiveIntegerField()
    match_number = models.PositiveIntegerField()
    
    player1 = models.ForeignKey(User, related_name="tournament_matches_as_player1", on_delete=models.CASCADE)
    player2 = models.ForeignKey(User, related_name="tournament_matches_as_player2", on_delete=models.CASCADE)
    
    winner = models.ForeignKey(User, null=True, blank=True, related_name="tournament_matches_won", on_delete=models.SET_NULL)
    loser = models.ForeignKey(User, null=True, blank=True, related_name="tournament_matches_lost", on_delete=models.SET_NULL)
    
    scheduled_time = models.DateTimeField(null=True, blank=True)
    played_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Round {self.round_number} - {self.player1.username} vs {self.player2.username}"

class Withdrawal(models.Model):
    """Modèle pour les demandes de retrait"""
    STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('processing', 'En cours de traitement'),
        ('completed', 'Terminé'),
        ('failed', 'Échoué'),
        ('cancelled', 'Annulé'),
    ]
    
    user = models.ForeignKey(User, related_name="withdrawals", on_delete=models.CASCADE)
    amount_euros = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Montant en euros")
    amount_tickets = models.PositiveIntegerField(verbose_name="Tickets déduits")
    
    # Informations bancaires au moment du retrait
    bank_account_holder = models.CharField(max_length=100, verbose_name="Titulaire du compte")
    bank_iban = models.CharField(max_length=34, verbose_name="IBAN")
    bank_bic = models.CharField(max_length=11, verbose_name="BIC/SWIFT")
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Métadonnées
    created_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    admin_notes = models.TextField(blank=True, verbose_name="Notes administrateur")
    
    # Simulation de transfert
    transaction_id = models.CharField(max_length=50, blank=True, verbose_name="ID de transaction simulé")
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Retrait {self.amount_euros}€ - {self.user.username} ({self.status})"
    
    def save(self, *args, **kwargs):
        # Calculer automatiquement les tickets si pas défini
        if not self.amount_tickets:
            self.amount_tickets = int(self.amount_euros * 10)
        super().save(*args, **kwargs)