# Dependencies for FastAPI API

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from pydantic import ValidationError
from typing import Optional, List
from uuid import UUID

from app.core.config import settings
from app.core.db import get_supabase_client
from app.schemas import Profile, TokenData

# Although Supabase client handles auth, we might need to decode the token
# passed in the Authorization header to get user info and roles within FastAPI.
# The Supabase client library often does this implicitly when making requests,
# but for dependency injection and role checks, explicit handling is clearer.

# This scheme expects the token to be sent in the Authorization header like: "Bearer <token>"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token") # tokenUrl is dummy here, Supabase handles actual auth

supabase = get_supabase_client()

async def get_current_user_data(token: str = Depends(oauth2_scheme)) -> TokenData:
    """Decodes the Supabase JWT token and returns user data including ID and role."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Use Supabase GoTrue client to get user from token
        # Note: This makes an external call to Supabase to validate the token
        response = await supabase.auth.get_user(token)
        user = response.user
        if not user:
            raise credentials_exception

        # Extract role from user metadata or default to customer
        user_role = user.user_metadata.get("role", "customer")

        token_data = TokenData(user_id=user.id, role=user_role)
        return token_data

    except Exception as e: # Catch potential Supabase client errors or other issues
        print(f"Error validating token: {e}") # Log the error
        raise credentials_exception

async def get_current_user_profile(user_data: TokenData = Depends(get_current_user_data)) -> Profile:
    """Fetches the user profile from the database based on the validated token data."""
    profile_exception = HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="User profile not found",
    )
    try:
        response = await supabase.table("profiles").select("*").eq("id", str(user_data.user_id)).maybe_single().execute()
        if not response.data:
            raise profile_exception
        return Profile(**response.data)
    except Exception as e:
        print(f"Error fetching profile: {e}") # Log the error
        raise profile_exception

# --- Role Specific Dependencies --- #

def require_role(required_roles: List[str]):
    """Factory function to create a dependency that checks for specific user roles."""
    async def role_checker(user_data: TokenData = Depends(get_current_user_data)) -> TokenData:
        if user_data.role not in required_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation requires one of the following roles: {required_roles}"
            )
        return user_data
    return role_checker

# Specific role dependencies
get_current_active_merchant_admin = require_role(["merchant_admin"])
get_current_active_advertiser = require_role(["third_party_advertiser", "merchant_admin"]) # Allow merchants to manage ads too
get_current_active_customer = require_role(["customer"])
get_current_active_system_admin = require_role(["system_admin"])

