from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DuelViewSet, UserViewSet, TournamentViewSet
from .views import home
from .admin_views import AdminDuelViewSet
from .wallet_views import WithdrawalViewSet, AdminWithdrawalViewSet
from .kyc_views import KYCViewSet, AdminKYCViewSet

router = DefaultRouter()
router.register(r'duels', DuelViewSet)
router.register(r'users', UserViewSet)
router.register(r'tournaments', TournamentViewSet)
router.register(r'withdrawals', WithdrawalViewSet, basename='withdrawals')
router.register(r'kyc', KYCViewSet, basename='kyc')
router.register(r'admin/duels', AdminDuelViewSet, basename='admin-duels')
router.register(r'admin/withdrawals', AdminWithdrawalViewSet, basename='admin-withdrawals')
router.register(r'admin/kyc', AdminKYCViewSet, basename='admin-kyc')

urlpatterns = [
    path('welcome/', home),
    path('', include(router.urls)),
]