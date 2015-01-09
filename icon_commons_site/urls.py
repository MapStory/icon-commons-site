from django.conf.urls import patterns, include, url

from django.contrib import admin
admin.autodiscover()

urlpatterns = patterns('icon_commons_site.views',
    url(r'^$', 'home', name='home'),
    url(r'^icons/', include('icon_commons.urls')),
    url(r'^admin/', include(admin.site.urls)),
)
