from django.core.management.base import BaseCommand
from django.utils import timezone
from core.models import Duel
from datetime import timedelta

class Command(BaseCommand):
    help = 'Résout automatiquement les duels en attente et gère les expirations'

    def handle(self, *args, **options):
        now = timezone.now()
        
        # 1. Résoudre les duels en attente de preuve (après 6h)
        waiting_duels = Duel.objects.filter(status='waiting_proof')
        resolved_count = 0
        
        for duel in waiting_duels:
            if duel.auto_resolve_if_possible():
                duel.save()
                winner = duel.winner
                
                # Récompenser le vainqueur
                winner.tickets += duel.tickets * 2
                winner.victories += 1
                
                # Mettre à jour le rang
                if winner.victories >= 50:
                    winner.rank = "Légende"
                elif winner.victories >= 20:
                    winner.rank = "Expert"
                elif winner.victories >= 10:
                    winner.rank = "Confirmé"
                elif winner.victories >= 5:
                    winner.rank = "Intermédiaire"
                
                winner.save()
                resolved_count += 1
                
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Duel {duel.id} résolu automatiquement - Vainqueur: {winner.username}'
                    )
                )
        
        # 2. Expirer les duels non joués (après 24h)
        expired_duels = Duel.objects.filter(
            status='ongoing',
            expires_at__lt=now
        )
        expired_count = 0
        
        for duel in expired_duels:
            duel.status = 'expired'
            duel.save()
            
            # Rembourser les participants
            duel.creator.tickets += duel.tickets
            duel.creator.save()
            
            if duel.opponent:
                duel.opponent.tickets += duel.tickets
                duel.opponent.save()
            
            expired_count += 1
            
            self.stdout.write(
                self.style.WARNING(
                    f'Duel {duel.id} expiré - Participants remboursés'
                )
            )
        
        # 3. Marquer les duels disputés anciens pour review admin
        old_disputes = Duel.objects.filter(
            status='disputed',
            created_at__lt=now - timedelta(hours=12)
        )
        
        for duel in old_disputes:
            self.stdout.write(
                self.style.ERROR(
                    f'ATTENTION: Duel {duel.id} en dispute depuis plus de 12h - Review admin requise'
                )
            )
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Résolution automatique terminée: {resolved_count} duels résolus, {expired_count} expirés'
            )
        )
