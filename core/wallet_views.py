from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db import transaction
import uuid
import time
from .models import Withdrawal
from .serializers import WithdrawalSerializer, WithdrawalRequestSerializer

class WithdrawalViewSet(viewsets.ModelViewSet):
    """ViewSet pour gérer les retraits d'argent"""
    serializer_class = WithdrawalSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Withdrawal.objects.filter(user=self.request.user)
    
    def get_serializer_class(self):
        if self.action == 'create':
            return WithdrawalRequestSerializer
        return WithdrawalSerializer
    
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        """Créer une demande de retrait"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = request.user
        amount_euros = serializer.validated_data['amount_euros']
        tickets_needed = int(amount_euros * 10)
        
        # Vérification finale des tickets
        if user.tickets < tickets_needed:
            return Response(
                {"error": "Tickets insuffisants"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Déduire les tickets immédiatement
        user.tickets -= tickets_needed
        user.save()
        
        # Créer la demande de retrait
        withdrawal = serializer.save(
            user=user,
            amount_tickets=tickets_needed
        )
        
        # Lancer la simulation de traitement
        self._simulate_processing(withdrawal)
        
        return Response(
            WithdrawalSerializer(withdrawal).data,
            status=status.HTTP_201_CREATED
        )
    
    def _simulate_processing(self, withdrawal):
        """Simule le traitement du retrait"""
        # Générer un ID de transaction simulé
        withdrawal.transaction_id = f"TXN_{uuid.uuid4().hex[:8].upper()}"
        withdrawal.status = 'processing'
        withdrawal.save()
        
        # En réalité, ici on déclencherait un traitement en arrière-plan
        # Pour la simulation, on va marquer comme terminé immédiatement
        withdrawal.status = 'completed'
        withdrawal.processed_at = timezone.now()
        withdrawal.admin_notes = f"Virement simulé vers IBAN {withdrawal.bank_iban[-4:]} - ID: {withdrawal.transaction_id}"
        withdrawal.save()
    
    @action(detail=False, methods=['get'])
    def balance(self, request):
        """Récupérer le solde et les informations de conversion"""
        user = request.user
        tickets = user.tickets
        euros_available = tickets // 10
        tickets_remainder = tickets % 10
        
        return Response({
            "tickets": tickets,
            "euros_available": euros_available,
            "tickets_remainder": tickets_remainder,
            "conversion_rate": "1€ = 10 tickets",
            "min_withdrawal": 1,
            "max_withdrawal": 1000
        })
    
    @action(detail=False, methods=['get'])
    def history(self, request):
        """Historique des retraits"""
        withdrawals = self.get_queryset().order_by('-created_at')
        serializer = WithdrawalSerializer(withdrawals, many=True)
        return Response(serializer.data)

class AdminWithdrawalViewSet(viewsets.ModelViewSet):
    """ViewSet admin pour gérer tous les retraits"""
    queryset = Withdrawal.objects.all().order_by('-created_at')
    serializer_class = WithdrawalSerializer
    permission_classes = [permissions.IsAdminUser]
    
    @action(detail=True, methods=['patch'])
    def approve(self, request, pk=None):
        """Approuver un retrait"""
        withdrawal = self.get_object()
        
        if withdrawal.status != 'pending':
            return Response(
                {"error": "Ce retrait ne peut pas être approuvé"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        withdrawal.status = 'processing'
        withdrawal.admin_notes = f"Approuvé par {request.user.username} le {timezone.now()}"
        withdrawal.save()
        
        # Simuler le traitement
        self._simulate_bank_transfer(withdrawal)
        
        return Response(WithdrawalSerializer(withdrawal).data)
    
    @action(detail=True, methods=['patch'])
    def reject(self, request, pk=None):
        """Rejeter un retrait et rembourser les tickets"""
        withdrawal = self.get_object()
        reason = request.data.get('reason', 'Rejeté par l\'administrateur')
        
        if withdrawal.status not in ['pending', 'processing']:
            return Response(
                {"error": "Ce retrait ne peut pas être rejeté"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Rembourser les tickets
        withdrawal.user.tickets += withdrawal.amount_tickets
        withdrawal.user.save()
        
        # Marquer comme annulé
        withdrawal.status = 'cancelled'
        withdrawal.admin_notes = f"Rejeté par {request.user.username}: {reason}"
        withdrawal.save()
        
        return Response(WithdrawalSerializer(withdrawal).data)
    
    def _simulate_bank_transfer(self, withdrawal):
        """Simule le virement bancaire"""
        # Générer un ID de transaction
        withdrawal.transaction_id = f"BANK_{uuid.uuid4().hex[:10].upper()}"
        
        # Marquer comme terminé
        withdrawal.status = 'completed'
        withdrawal.processed_at = timezone.now()
        withdrawal.admin_notes += f" - Virement effectué vers {withdrawal.bank_iban[-4:]} - ID: {withdrawal.transaction_id}"
        withdrawal.save()
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Statistiques des retraits pour l'admin"""
        from django.db.models import Sum, Count
        
        total_withdrawals = Withdrawal.objects.aggregate(
            total_amount=Sum('amount_euros'),
            total_count=Count('id')
        )
        
        by_status = dict(
            Withdrawal.objects.values('status').annotate(count=Count('status')).values_list('status', 'count')
        )
        
        pending_amount = Withdrawal.objects.filter(status='pending').aggregate(
            pending_amount=Sum('amount_euros')
        )['pending_amount'] or 0
        
        return Response({
            "total_amount": total_withdrawals['total_amount'] or 0,
            "total_count": total_withdrawals['total_count'],
            "by_status": by_status,
            "pending_amount": pending_amount
        })
