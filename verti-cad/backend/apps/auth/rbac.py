"""
===============================================================================
VERTI-CAD: Role-Based Access Control (RBAC) & Authentication Engine
===============================================================================
Enforces the 6-Role Security Matrix (Diagram 1):
  1. Super Admin: Full system root access
  2. Admin: Administrative management of cadastre & users
  3. Operator (Surveyor / Field Operator): Field data upload, editing & modeling
  4. Verifier (Government Official / Revenue Inspector): Verification, approval & dispute
  5. Viewer (GIS Analyst / Integrator): Spatial query, analytical reports & view-only
  6. Citizen (Property Owner): Citizen self-service, view owned units, ULPIN certificates
===============================================================================
"""
from enum import Enum
from typing import List, Dict, Set, Optional, Callable
from functools import wraps
from rest_framework import permissions, exceptions

class UserRole(str, Enum):
    SUPER_ADMIN = "SUPER_ADMIN"
    ADMIN = "ADMIN"
    OPERATOR = "OPERATOR"
    VERIFIER = "VERIFIER"
    VIEWER = "VIEWER"
    CITIZEN = "CITIZEN"

class PermissionAction(str, Enum):
    # User & System
    USER_MGMT = "USER_MANAGEMENT"
    ROLE_MGMT = "ROLE_MANAGEMENT"
    SYSTEM_SETTINGS = "SYSTEM_SETTINGS"
    
    # Core Cadastre
    PROPERTY_PARCEL_MGMT = "PROPERTY_PARCEL_MANAGEMENT"
    MODELING_3D = "3D_PROCESSING_AND_MODELING"
    ULPIN_GENERATION = "ULPIN_GENERATION"
    
    # Legal & Verification
    VERIFICATION_APPROVAL = "VERIFICATION_AND_APPROVAL"
    DOCUMENTS_MGMT = "DOCUMENTS_MANAGEMENT"
    REPORTS_ANALYTICS = "REPORTS_AND_ANALYTICS"

# Comprehensive Roles and Permissions Matrix (Diagram 1)
RBAC_MATRIX: Dict[UserRole, Set[PermissionAction]] = {
    UserRole.SUPER_ADMIN: {
        PermissionAction.USER_MGMT,
        PermissionAction.ROLE_MGMT,
        PermissionAction.PROPERTY_PARCEL_MGMT,
        PermissionAction.MODELING_3D,
        PermissionAction.ULPIN_GENERATION,
        PermissionAction.VERIFICATION_APPROVAL,
        PermissionAction.REPORTS_ANALYTICS,
        PermissionAction.DOCUMENTS_MGMT,
        PermissionAction.SYSTEM_SETTINGS
    },
    UserRole.ADMIN: {
        PermissionAction.USER_MGMT,
        PermissionAction.ROLE_MGMT,
        PermissionAction.PROPERTY_PARCEL_MGMT,
        PermissionAction.MODELING_3D,
        PermissionAction.ULPIN_GENERATION,
        PermissionAction.VERIFICATION_APPROVAL,
        PermissionAction.REPORTS_ANALYTICS,
        PermissionAction.DOCUMENTS_MGMT
        # No System Settings
    },
    UserRole.OPERATOR: {
        # Field Surveyor / Drone Operator
        PermissionAction.PROPERTY_PARCEL_MGMT,
        PermissionAction.MODELING_3D,
        PermissionAction.ULPIN_GENERATION,
        PermissionAction.DOCUMENTS_MGMT,
        PermissionAction.REPORTS_ANALYTICS
        # No User Mgmt, No Approval Authority
    },
    UserRole.VERIFIER: {
        # Revenue Officer / Tehsildar
        PermissionAction.PROPERTY_PARCEL_MGMT,
        PermissionAction.ULPIN_GENERATION,
        PermissionAction.VERIFICATION_APPROVAL,
        PermissionAction.DOCUMENTS_MGMT,
        PermissionAction.REPORTS_ANALYTICS
    },
    UserRole.VIEWER: {
        # GIS Analyst / Bank / Utility Integrator
        PermissionAction.REPORTS_ANALYTICS
        # Read-only queries to properties, models, documents via separate read-gate
    },
    UserRole.CITIZEN: {
        # Property Owner
        # Scoped access to own units, certificates, and validation status
    }
}

class HasCadastralPermission(permissions.BasePermission):
    """
    DRF Permission Class enforcing fine-grained module-level action permissions.
    """
    def __init__(self, required_action: PermissionAction):
        self.required_action = required_action

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False

        user_role_str = getattr(user, 'role', None) or (user.is_superuser and UserRole.SUPER_ADMIN)
        try:
            role = UserRole(user_role_str)
        except (ValueError, TypeError):
            return False

        allowed_actions = RBAC_MATRIX.get(role, set())
        return self.required_action in allowed_actions

def check_user_permission(role: UserRole, action: PermissionAction) -> bool:
    """Helper to programmatically verify access."""
    return action in RBAC_MATRIX.get(role, set())
