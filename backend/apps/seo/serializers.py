from rest_framework import serializers
from .models import SEOKeyword, SEOPage, SEODataPoint


class SEODataPointSerializer(serializers.ModelSerializer):
    keyword_text = serializers.SerializerMethodField()
    page_url = serializers.SerializerMethodField()

    class Meta:
        model = SEODataPoint
        fields = (
            'id', 'date', 'keyword_text', 'page_url',
            'clicks', 'impressions', 'ctr', 'position',
            'device', 'country',
        )

    def get_keyword_text(self, obj):
        return obj.keyword.keyword if obj.keyword else None

    def get_page_url(self, obj):
        return obj.page.url if obj.page else None


class SEOSummarySerializer(serializers.Serializer):
    total_clicks = serializers.IntegerField()
    total_impressions = serializers.IntegerField()
    avg_ctr = serializers.DecimalField(max_digits=6, decimal_places=4)
    avg_position = serializers.DecimalField(max_digits=6, decimal_places=2)
    total_keywords = serializers.IntegerField()
    total_pages = serializers.IntegerField()


class TopKeywordSerializer(serializers.Serializer):
    keyword__keyword = serializers.CharField(source='keyword')
    total_clicks = serializers.IntegerField()
    total_impressions = serializers.IntegerField()
    avg_ctr = serializers.DecimalField(max_digits=6, decimal_places=4)
    avg_position = serializers.DecimalField(max_digits=6, decimal_places=2)


class TopPageSerializer(serializers.Serializer):
    page__url = serializers.CharField(source='url')
    total_clicks = serializers.IntegerField()
    total_impressions = serializers.IntegerField()
    avg_ctr = serializers.DecimalField(max_digits=6, decimal_places=4)
    avg_position = serializers.DecimalField(max_digits=6, decimal_places=2)


class DailyTrendSerializer(serializers.Serializer):
    date = serializers.DateField()
    total_clicks = serializers.IntegerField()
    total_impressions = serializers.IntegerField()
    avg_ctr = serializers.DecimalField(max_digits=6, decimal_places=4)
    avg_position = serializers.DecimalField(max_digits=6, decimal_places=2)


class DeviceBreakdownSerializer(serializers.Serializer):
    device = serializers.CharField()
    total_clicks = serializers.IntegerField()
    total_impressions = serializers.IntegerField()
    avg_ctr = serializers.DecimalField(max_digits=6, decimal_places=4)
    avg_position = serializers.DecimalField(max_digits=6, decimal_places=2)


class CountryBreakdownSerializer(serializers.Serializer):
    country = serializers.CharField()
    total_clicks = serializers.IntegerField()
    total_impressions = serializers.IntegerField()


class SEOFilterSerializer(serializers.Serializer):
    date_from = serializers.DateField(required=False)
    date_to = serializers.DateField(required=False)
    device = serializers.ChoiceField(
        choices=['web', 'mobile', 'tablet'], required=False
    )
    country = serializers.CharField(max_length=10, required=False)
    keyword = serializers.CharField(required=False)
    page = serializers.CharField(required=False)
    limit = serializers.IntegerField(min_value=1, max_value=200, default=50, required=False)
    order_by = serializers.ChoiceField(
        choices=['clicks', 'impressions', 'ctr', 'position'],
        default='clicks',
        required=False,
    )