from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import ULPINRecord
from .serializers import ULPINRecordSerializer, ULPINGenerateRequestSerializer, ULPINValidateRequestSerializer
from .engine import generate_3d_ulpin, generate_ulpin, validate_ulpin, decode_ulpin
from apps.properties.models import PropertyUnit

class ULPINDetailView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, ulpin):
        # Look up in database
        record = ULPINRecord.objects.filter(ulpin_code__iexact=ulpin).select_related(
            'property_unit', 'property_unit__floor',
            'property_unit__floor__building', 'property_unit__floor__building__parcel'
        ).first()
        
        if record:
            data = ULPINRecordSerializer(record).data
            try:
                data['decoded'] = decode_ulpin(record.ulpin_code)
            except Exception:
                pass
            return Response(data)
        
        # If not in DB, validate and decode synthetic string
        is_valid, message = validate_ulpin(ulpin)
        if not is_valid:
            return Response({'error': message, 'ulpin': ulpin}, status=status.HTTP_404_NOT_FOUND)
        
        try:
            decoded = decode_ulpin(ulpin)
            return Response({
                'ulpin_code': decoded['ulpin'],
                'decoded': decoded,
                'is_synthetic': True,
                'disclaimer': 'Prototype 3D ULPIN / Demonstration Identifier (Decoded on the fly)'
            })
        except Exception as e:
            return Response({'error': str(e), 'ulpin': ulpin}, status=status.HTTP_400_BAD_REQUEST)

class ULPINGenerateView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ULPINGenerateRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        volume = data.get('volume', 375.0)
        
        # Generate new standardized 3D ULPIN
        ulpin = generate_3d_ulpin(
            parcel_number=data['parcel_number'],
            building_code=data['building_code'],
            floor_number=data['floor_number'],
            unit_number=data['unit_number'],
            volume=volume
        )
        
        decoded = decode_ulpin(ulpin)
        return Response({
            'ulpin': ulpin,
            'volume_hash': decoded.get('volume_hash', ''),
            'components': {
                'parcel_id': decoded.get('parcel_code', ''),
                'building_id': decoded.get('building_code', ''),
                'floor_id': decoded.get('level_code', ''),
                'unit_id': decoded.get('unit_code', ''),
                'vol_hash': decoded.get('volume_hash', '')
            },
            'hierarchy': decoded.get('hierarchy', {}),
            'decoded': decoded,
            'disclaimer': 'Prototype 3D ULPIN / Demonstration Identifier (SIH 2026)'
        }, status=status.HTTP_201_CREATED)

class ULPINValidateView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ULPINValidateRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        ulpin = serializer.validated_data['ulpin']
        is_valid, message = validate_ulpin(ulpin)
        
        decoded = None
        if is_valid:
            try:
                decoded = decode_ulpin(ulpin)
            except Exception:
                pass

        return Response({
            'ulpin': ulpin,
            'is_valid': is_valid,
            'message': message,
            'decoded': decoded,
            'disclaimer': 'Prototype 3D ULPIN / Demonstration Identifier (SIH 2026)'
        })
