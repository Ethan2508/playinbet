from rest_framework import serializers
from .models import User, Duel, Tournament, TournamentParticipant, TournamentMatch, Withdrawal
from django.contrib.auth.password_validation import validate_password

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'tickets', 'victories', 'rank', 'date_joined']
        extra_kwargs = {
            'email': {'required': True},
            'password': {'write_only': True}
        }
    
    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        return user

class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for user profile with more details"""
    total_duels = serializers.SerializerMethodField()
    win_rate = serializers.SerializerMethodField()
    is_admin = serializers.SerializerMethodField()
    can_play = serializers.SerializerMethodField()
    can_withdraw = serializers.SerializerMethodField()
    verification_status_display = serializers.CharField(source='get_verification_status_display', read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'tickets', 'victories', 
                 'rank', 'role', 'date_joined', 'total_duels', 'win_rate', 'is_admin',
                 'is_verified', 'verification_status', 'verification_status_display',
                 'can_play', 'can_withdraw', 'verification_submitted_at', 'verification_completed_at']
    
    def get_is_admin(self, obj):
        return obj.is_admin()
    
    def get_can_play(self, obj):
        return obj.can_play()
    
    def get_can_withdraw(self, obj):
        return obj.can_withdraw()
    
    def get_total_duels(self, obj):
        return obj.created_duels.count() + obj.joined_duels.count()
    
    def get_win_rate(self, obj):
        total = self.get_total_duels(obj)
        if total == 0:
            return 0
        return round((obj.victories / total) * 100, 1)

class KYCVerificationSerializer(serializers.ModelSerializer):
    """Serializer pour la vérification KYC"""
    
    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'date_of_birth', 'nationality', 
            'phone_number', 'address', 'city', 'postal_code', 'country',
            'bank_name', 'iban', 'bic', 'identity_document', 'proof_of_address'
        ]
    
    def validate_date_of_birth(self, value):
        """Vérifier que l'utilisateur a au moins 18 ans"""
        if not value:
            raise serializers.ValidationError("La date de naissance est obligatoire")
        
        from datetime import date
        today = date.today()
        age = today.year - value.year - ((today.month, today.day) < (value.month, value.day))
        
        if age < 18:
            raise serializers.ValidationError("Vous devez avoir au moins 18 ans pour utiliser cette plateforme")
        
        return value
    
    def validate_iban(self, value):
        """Validation basique de l'IBAN"""
        if not value:
            raise serializers.ValidationError("L'IBAN est obligatoire")
        
        # Supprime les espaces et convertit en majuscules
        iban = value.replace(' ', '').upper()
        
        # Vérification de la longueur (entre 15 et 34 caractères)
        if len(iban) < 15 or len(iban) > 34:
            raise serializers.ValidationError("L'IBAN doit contenir entre 15 et 34 caractères")
        
        return iban
    
    def validate_bic(self, value):
        """Validation basique du BIC"""
        if not value:
            raise serializers.ValidationError("Le BIC est obligatoire")
        
        # Supprime les espaces et convertit en majuscules
        bic = value.replace(' ', '').upper()
        
        # Vérification de la longueur (8 ou 11 caractères)
        if len(bic) not in [8, 11]:
            raise serializers.ValidationError("Le BIC doit contenir 8 ou 11 caractères")
        
        return bic
    
    def validate(self, attrs):
        """Validation globale"""
        required_fields = [
            'first_name', 'last_name', 'date_of_birth', 'nationality',
            'phone_number', 'address', 'city', 'postal_code', 'country',
            'bank_name', 'iban', 'bic'
        ]
        
        for field in required_fields:
            if not attrs.get(field):
                field_verbose = self.fields[field].label or field
                raise serializers.ValidationError(f"Le champ {field_verbose} est obligatoire")
        
        return attrs

class UserEditSerializer(serializers.ModelSerializer):
    """Serializer for editing user profile"""
    
    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name']
        
    def validate_username(self, value):
        user = self.instance
        if User.objects.exclude(pk=user.pk).filter(username=value).exists():
            raise serializers.ValidationError("Ce nom d'utilisateur est déjà pris.")
        return value
        
    def validate_email(self, value):
        user = self.instance
        if User.objects.exclude(pk=user.pk).filter(email=value).exists():
            raise serializers.ValidationError("Cette adresse email est déjà utilisée.")
        return value

class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer pour le profil utilisateur avec informations KYC"""
    verification_status_display = serializers.CharField(source='get_verification_status_display', read_only=True)
    can_play = serializers.SerializerMethodField()
    can_withdraw = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'tickets',
            'is_verified', 'verification_status', 'verification_status_display',
            'verification_submitted_at', 'verification_completed_at', 
            'verification_notes', 'can_play', 'can_withdraw',
            'date_of_birth', 'nationality', 'phone_number', 'address',
            'city', 'postal_code', 'country', 'bank_name', 'iban', 'bic'
        ]
        read_only_fields = [
            'id', 'tickets', 'is_verified', 'verification_status',
            'verification_submitted_at', 'verification_completed_at', 
            'verification_notes', 'can_play', 'can_withdraw'
        ]
    
    def get_can_play(self, obj):
        return obj.can_play()
    
    def get_can_withdraw(self, obj):
        return obj.can_withdraw()

class DuelSerializer(serializers.ModelSerializer):
    creator = UserProfileSerializer(read_only=True)
    opponent = UserProfileSerializer(read_only=True)
    winner = UserProfileSerializer(read_only=True)
    game_display = serializers.CharField(source='get_game_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    is_expired = serializers.SerializerMethodField()
    time_remaining = serializers.SerializerMethodField()
    time_elapsed = serializers.SerializerMethodField()
    can_join = serializers.SerializerMethodField()
    both_players_ready = serializers.SerializerMethodField()
    
    class Meta:
        model = Duel
        fields = [
            'id', 'creator', 'opponent', 'game_type', 'game_display', 'category_display',
            'amount', 'duration_minutes', 'winner', 'status', 'status_display', 
            'creator_action', 'opponent_action', 'creator_screenshot', 'opponent_screenshot',
            'creator_ready', 'opponent_ready', 'both_players_ready',
            'ai_validation_result', 'ai_confidence', 'created_at', 'started_at', 
            'expires_at', 'completed_at', 'is_expired', 'time_remaining', 'time_elapsed', 'can_join',
            'admin_resolution', 'admin_reason', 'resolved_by', 'resolved_at'
        ]
        
    def get_is_expired(self, obj):
        return obj.is_expired()
    
    def get_time_remaining(self, obj):
        """Retourne le temps restant en secondes"""
        return obj.time_remaining()
        
    def get_time_elapsed(self, obj):
        """Retourne le temps écoulé depuis le début en secondes"""
        return obj.time_elapsed
        
    def get_both_players_ready(self, obj):
        """Vérifie si les deux joueurs sont prêts"""
        return obj.both_players_ready
        
    def get_can_join(self, obj):
        """Vérifier si l'utilisateur actuel peut rejoindre ce duel"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.can_join(request.user)
        return False
        
    def create(self, validated_data):
        validated_data['creator'] = self.context['request'].user
        return super().create(validated_data)

class TournamentParticipantSerializer(serializers.ModelSerializer):
    user = UserProfileSerializer(read_only=True)
    
    class Meta:
        model = TournamentParticipant
        fields = ['user', 'registered_at', 'eliminated_at', 'final_position']

class TournamentMatchSerializer(serializers.ModelSerializer):
    player1 = UserProfileSerializer(read_only=True)
    player2 = UserProfileSerializer(read_only=True)
    winner = UserProfileSerializer(read_only=True)
    loser = UserProfileSerializer(read_only=True)
    
    class Meta:
        model = TournamentMatch
        fields = ['id', 'round_number', 'match_number', 'player1', 'player2', 
                 'winner', 'loser', 'scheduled_time', 'played_at']

class TournamentSerializer(serializers.ModelSerializer):
    participants = TournamentParticipantSerializer(many=True, read_only=True)
    matches = TournamentMatchSerializer(many=True, read_only=True)
    game_display = serializers.CharField(source='get_game_display', read_only=True)
    format_display = serializers.CharField(source='get_format_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    winner = UserProfileSerializer(read_only=True)
    current_participants = serializers.ReadOnlyField()
    is_full = serializers.ReadOnlyField()
    can_register = serializers.ReadOnlyField()
    
    class Meta:
        model = Tournament
        fields = ['id', 'name', 'description', 'game', 'game_display', 'entry_fee', 
                 'prize_pool', 'max_participants', 'current_participants', 'format', 
                 'format_display', 'registration_start', 'registration_end', 'start_date', 
                 'end_date', 'status', 'status_display', 'winner', 'is_full', 'can_register',
                 'participants', 'matches', 'created_at']

class WithdrawalSerializer(serializers.ModelSerializer):
    """Serializer pour les demandes de retrait"""
    user = UserProfileSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Withdrawal
        fields = ['id', 'user', 'amount_euros', 'amount_tickets', 'bank_account_holder', 
                 'bank_iban', 'bank_bic', 'status', 'status_display', 'created_at', 
                 'processed_at', 'admin_notes', 'transaction_id']
        read_only_fields = ['user', 'amount_tickets', 'status', 'processed_at', 
                          'admin_notes', 'transaction_id']

class WithdrawalRequestSerializer(serializers.ModelSerializer):
    """Serializer pour créer une demande de retrait"""
    
    class Meta:
        model = Withdrawal
        fields = ['amount_euros', 'bank_account_holder', 'bank_iban', 'bank_bic']
    
    def validate_amount_euros(self, value):
        if value <= 0:
            raise serializers.ValidationError("Le montant doit être positif")
        if value < 1:
            raise serializers.ValidationError("Le montant minimum de retrait est de 1€")
        if value > 1000:
            raise serializers.ValidationError("Le montant maximum de retrait est de 1000€")
        return value
    
    def validate_bank_iban(self, value):
        if not value or len(value) < 15:
            raise serializers.ValidationError("IBAN invalide")
        return value.upper().replace(' ', '')
    
    def validate_bank_bic(self, value):
        if not value or len(value) < 8:
            raise serializers.ValidationError("BIC invalide")
        return value.upper()
    
    def validate(self, attrs):
        user = self.context['request'].user
        amount_euros = attrs['amount_euros']
        tickets_needed = int(amount_euros * 10)
        
        if user.tickets < tickets_needed:
            raise serializers.ValidationError(
                f"Tickets insuffisants. Vous avez {user.tickets} tickets, "
                f"mais {tickets_needed} sont nécessaires pour {amount_euros}€"
            )
        
        return attrs