from django.shortcuts import render_to_response
from django.http import HttpResponseRedirect
from django.template import RequestContext
from django.core.exceptions import ObjectDoesNotExist
from django.core.urlresolvers import reverse
from icon_commons.forms import IconForm
from icon_commons.models import Icon
from icon_commons.models import Collection
import time
import zipfile

# Notes: error proof the splits
def home(req):
	if req.method == 'POST':
		form = IconForm(req.POST, req.FILES)
		if form.is_valid():
			tags = form.cleaned_data['tags']
			# This should be the same as form.cleaned_data['svg'] I think
			svg = req.FILES['svg']
			collection_name = form.cleaned_data['collection']
			# If they defined a collection name, use that. Otherwise, use the name of the file/zip
			col_name = collection_name if collection_name else svg.name.split('.')[0]
			# Two possibilities we want to handle:
			# a) it's a .zip, so unzip it and ingest all files
			# b) it's a .svg, so just ingest this one file
			file_type = svg.name.split('.')[1]
			if file_type == 'zip':
				unzipped = zipfile.ZipFile(svg)
				for file_name in unzipped.namelist():
					# If it doesn't have an extension, skip it
					if len(file_name.split('.')) == 1:
						continue
					unzipped_type = file_name.split('.')[1]
					if unzipped_type != 'svg':
						continue
					current_time = time.time()
					col, col_created = Collection.objects.get_or_create(name=col_name)
					icon_name = file_name.split('.')[0].split('/')[1] # NOTE: not sure if this is correct to do on all OS's...
					icon, icon_created = Icon.objects.get_or_create(name=icon_name, collection=col)
					msg = 'initial import' if icon_created else 'automatic update'
					# Add tags to the icon
					icon.tags.add(*tags)
					data = unzipped.read(file_name)
					updated = True
					try:
						latest = icon.icondata_set.latest('version')
						updated = latest.svg == data
					except ObjectDoesNotExist:
						pass
					if updated:
						icon.new_version(data, msg)
					icon.save()					
			elif file_type == 'svg':
				current_time = time.time()
				col, col_created = Collection.objects.get_or_create(name=col_name)
				icon_name = svg.name.split('.')[0]
				icon, icon_created = Icon.objects.get_or_create(name=icon_name, collection=col)
				msg = 'initial import' if icon_created else 'automatic update'
				icon.tags.add(*tags)
				data = svg.read()
				updated = True
				try:
					latest = icon.icondata_set.latest('version')
					updated = latest.svg == data
				except ObjectDoesNotExist:
					pass
				if updated:
					icon.new_version(data, msg)
				icon.save()
			else:
				return HttpResponseRedirect(reverse('home'))
	else:
		form = IconForm()
	return render_to_response('home.html', RequestContext(req, {"icon_form": form}))