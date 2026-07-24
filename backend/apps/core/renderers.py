from rest_framework.renderers import JSONRenderer
import json


class CustomJSONRenderer(JSONRenderer):
    def render(self, data, accepted_media_type=None, renderer_context=None):
        response = renderer_context.get('response') if renderer_context else None

        if data is None:
            return super().render(data, accepted_media_type, renderer_context)

        if isinstance(data, dict) and 'success' in data:
            return super().render(data, accepted_media_type, renderer_context)

        status_code = response.status_code if response else 200
        is_success = 200 <= status_code < 300

        wrapped = {
            'success': is_success,
            'data': data,
        }

        return super().render(wrapped, accepted_media_type, renderer_context)