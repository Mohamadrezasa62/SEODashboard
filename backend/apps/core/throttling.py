from rest_framework.throttling import AnonRateThrottle, UserRateThrottle


class BurstRateThrottle(UserRateThrottle):
    scope = 'burst'
    rate = '60/min'


class SustainedRateThrottle(UserRateThrottle):
    scope = 'sustained'
    rate = '1000/hour'


class LoginRateThrottle(AnonRateThrottle):
    scope = 'login'
    rate = '10/hour'

    def get_cache_key(self, request, view):
        ident = self.get_ident(request)
        return self.cache_format % {
            'scope': self.scope,
            'ident': ident,
        }


class RegisterRateThrottle(AnonRateThrottle):
    scope = 'register'
    rate = '5/hour'


class PasswordResetRateThrottle(AnonRateThrottle):
    scope = 'password_reset'
    rate = '5/hour'


class GSCSyncRateThrottle(UserRateThrottle):
    scope = 'gsc_sync'
    rate = '10/hour'


class AIRequestRateThrottle(UserRateThrottle):
    scope = 'ai_request'
    rate = '50/hour'


class ReportGenerationRateThrottle(UserRateThrottle):
    scope = 'report_generation'
    rate = '20/hour'