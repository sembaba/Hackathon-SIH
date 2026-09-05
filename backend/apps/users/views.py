from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth.models import User
from .models import UserProfile, UserRole
from .serializers import UserSerializer, RegisterSerializer

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

class CurrentUserView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        if request.user and request.user.is_authenticated:
            serializer = UserSerializer(request.user)
            return Response(serializer.data)
        # Default mock demo user if unauthenticated
        return Response({
            'id': 1,
            'username': 'demo_surveyor',
            'email': 'surveyor@verticad.gov.in',
            'first_name': 'Aarav',
            'last_name': 'Sharma',
            'role': UserRole.SURVEYOR,
            'profile': {
                'role': UserRole.SURVEYOR,
                'department': 'Haridwar Cadastral Survey Division',
                'phone': '+91 98765 43210'
            }
        })

class RoleSwitchView(APIView):
    """Allows instant role switching during demo / testing."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        role = request.data.get('role', UserRole.CITIZEN)
        if role not in [r[0] for r in UserRole.choices]:
            return Response({'error': f'Invalid role: {role}'}, status=status.HTTP_400_BAD_REQUEST)
        
        if request.user and request.user.is_authenticated:
            profile, _ = UserProfile.objects.get_or_create(user=request.user)
            profile.role = role
            profile.save()
            return Response({'message': f'Active role switched to {role}', 'role': role})
        
        return Response({'message': f'Demo role set to {role}', 'role': role})
