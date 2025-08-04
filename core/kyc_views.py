from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db import models
from .models import User
from .serializers import KYCVerificationSerializer, UserProfileSerializer

class KYCViewSet(viewsets.ViewSet):
    """ViewSet pour gérer la vérification KYC"""
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def status(self, request):
        """Récupérer le statut de vérification de l'utilisateur"""
        user = request.user
        serializer = UserProfileSerializer(user)
        return Response({
            'is_verified': user.is_verified,
            'verification_status': user.verification_status,
            'verification_status_display': user.get_verification_status_display(),
            'can_play': user.can_play(),
            'can_withdraw': user.can_withdraw(),
            'verification_submitted_at': user.verification_submitted_at,
            'verification_completed_at': user.verification_completed_at,
            'user': serializer.data
        })
    
    @action(detail=False, methods=['post'])
    def submit(self, request):
        """Soumettre la vérification KYC"""
        user = request.user
        
        # Vérifier si une vérification est déjà en cours ou terminée
        if user.verification_status == 'verified':
            return Response(
                {"error": "Votre compte est déjà vérifié"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = KYCVerificationSerializer(user, data=request.data, partial=False)
        if serializer.is_valid():
            # Sauvegarder les données KYC
            serializer.save()
            
            # Marquer comme soumis et en attente
            user.verification_status = 'pending'
            user.verification_submitted_at = timezone.now()
            
            # Pour la simulation, auto-approuver après 3 secondes
            # En production, cela serait fait par un admin
            self._simulate_kyc_approval(user)
            
            user.save()
            
            return Response({
                "message": "Vérification KYC soumise avec succès. Vous recevrez une notification une fois validée.",
                "verification_status": user.verification_status,
                "user": UserProfileSerializer(user).data
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def _simulate_kyc_approval(self, user):
        """Simule l'approbation automatique du KYC"""
        # En production, cela serait fait par un processus séparé ou un admin
        user.verification_status = 'verified'
        user.is_verified = True
        user.verification_completed_at = timezone.now()
        user.verification_notes = "Vérification automatique réussie (simulation)"
    
    @action(detail=False, methods=['get'])
    def requirements(self, request):
        """Retourne les exigences pour la vérification KYC"""
        return Response({
            "required_documents": [
                "Pièce d'identité valide (carte d'identité, passeport)",
                "Justificatif de domicile récent (facture, relevé bancaire)",
                "Informations bancaires (IBAN, BIC)"
            ],
            "required_fields": [
                "Prénom et nom complets",
                "Date de naissance (minimum 18 ans)",
                "Nationalité",
                "Adresse complète",
                "Numéro de téléphone",
                "Informations bancaires"
            ],
            "processing_time": "1-3 jours ouvrés (simulation instantanée)",
            "age_requirement": 18
        })

class AdminKYCViewSet(viewsets.ModelViewSet):
    """ViewSet admin pour gérer les vérifications KYC"""
    queryset = User.objects.filter(verification_status__in=['pending', 'verified', 'rejected']).order_by('-verification_submitted_at')
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAdminUser]
    
    @action(detail=True, methods=['patch'])
    def approve(self, request, pk=None):
        """Approuver une vérification KYC"""
        user = self.get_object()
        notes = request.data.get('notes', '')
        
        if user.verification_status != 'pending':
            return Response(
                {"error": "Cette vérification ne peut pas être approuvée"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.verification_status = 'verified'
        user.is_verified = True
        user.verification_completed_at = timezone.now()
        user.verification_notes = f"Approuvé par {request.user.username}: {notes}"
        user.save()
        
        return Response({
            "message": f"Vérification KYC approuvée pour {user.username}",
            "user": UserProfileSerializer(user).data
        })
    
    @action(detail=True, methods=['patch'])
    def reject(self, request, pk=None):
        """Rejeter une vérification KYC"""
        user = self.get_object()
        reason = request.data.get('reason', 'Documents insuffisants ou invalides')
        
        if user.verification_status != 'pending':
            return Response(
                {"error": "Cette vérification ne peut pas être rejetée"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.verification_status = 'rejected'
        user.is_verified = False
        user.verification_completed_at = timezone.now()
        user.verification_notes = f"Rejeté par {request.user.username}: {reason}"
        user.save()
        
        return Response({
            "message": f"Vérification KYC rejetée pour {user.username}",
            "reason": reason,
            "user": UserProfileSerializer(user).data
        })
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Statistiques des vérifications KYC"""
        from django.db.models import Count
        
        stats = User.objects.aggregate(
            total_users=Count('id'),
            verified_users=Count('id', filter=models.Q(is_verified=True)),
            pending_verifications=Count('id', filter=models.Q(verification_status='pending')),
            rejected_verifications=Count('id', filter=models.Q(verification_status='rejected'))
        )
        
        return Response(stats)
