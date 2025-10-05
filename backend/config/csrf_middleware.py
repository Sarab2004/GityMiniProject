from django.middleware.csrf import CsrfViewMiddleware
from django.utils.cache import patch_vary_headers
from django.utils.deprecation import MiddlewareMixin


class CustomCsrfMiddleware(MiddlewareMixin, CsrfViewMiddleware):
    """
    Custom CSRF middleware that handles cross-site requests better
    """
    
    def process_request(self, request):
        # Allow OPTIONS requests for CORS preflight
        if request.method == 'OPTIONS':
            return None
            
        return super().process_request(request)
    
    def process_response(self, request, response):
        # Add CORS headers for CSRF responses
        if hasattr(response, 'csrf_cookie_set') and response.csrf_cookie_set:
            response['Access-Control-Allow-Credentials'] = 'true'
            response['Access-Control-Allow-Origin'] = request.META.get('HTTP_ORIGIN', '*')
        
        return super().process_response(request, response)
