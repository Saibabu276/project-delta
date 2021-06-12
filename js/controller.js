var toaster = {
	empty: {
		header: 'Warning',
		color: '#ff7704',
		body: 'Json cannot be empty'
	},
	parseError: {
		header: 'Error',
		color: '#dc3545',
		body: 'Invalid JSON given, please correct the highlighted JSON'
	},
	copy: {
		header: 'Info',
		color: '#17a2b8',
		body: 'Content copied to clipboard'
	},
	nodiff: {
		header: 'Info',
		color: '#17a2b8',
		body: 'Nothing new added or edited in new JSON'
	},
	emptyProp: {
		header: 'Warning',
		color: '#ff7704',
		body: 'Properties cannot be empty'
	},
	nodiffProp: {
		header: 'Info',
		color: '#17a2b8',
		body: 'Nothing new added or edited in new Properties'
	}
}

function validateJson(jsonString) {
	var _parsedJson = {};
	try {
		return JSON.parse(jsonString);
	}
	catch (error) {
		console.error(error);
		return false;
	}
}

function checkJsonForWarningsAndErrors(oldJsonString, newJsonString, oldJson, newJson) {
	if (!newJsonString.trim() || !oldJsonString.trim()) {
			showToast('empty');
			return false;
		}

		if (!oldJson) {
			$('#old-json').addClass('highlight-red');
		}

		if (!newJson) {
			$('#new-json').addClass('highlight-red');
		}

		if (!oldJson || !newJson) {
			showToast('parseError');
			return false;
		}

		oldJson && newJson && $('textarea').removeClass('highlight-red');

		return true;
}

function closeError() {
	$('#error-toast').removeClass('swing')
	.addClass('fadeOutUp');
	setTimeout(function() {
		$('#error-toast').removeClass('show')
		.removeClass('fadeOutUp');
	}, 1000)
}


function findJsonDelta() {
	var oldJsonString = $('#old-json').val(),
		newJsonString = $('#new-json').val(),
		_oldJson = validateJson(oldJsonString),
		_newJson = validateJson(newJsonString);

		if (!checkJsonForWarningsAndErrors(oldJsonString, newJsonString, _oldJson, _newJson)) {
			return false;
		}

		var _jsonDifference = DeepDiff(_oldJson, _newJson); // Plugin returns json difference;

		if (!_jsonDifference || !_jsonDifference.length) {
			showToast('nodiff');
		}

		var _parsedJsonDifference = _parseJsonDifference(_jsonDifference);

		_parsedJsonDifference = JSON.stringify(_parsedJsonDifference, null, 2);
								//.replace(/\"([^"]+)\":/g,"$1:").replace(/\uFFFF/g,"\\\""); replaces quotes on keys

		$('#result-output').val(_parsedJsonDifference);
		showOutput();
}

function _parseJsonDifference(jsonDiff) {
	var _parsedJsonDiff = {};

	for(diffItem of jsonDiff) {
		if ((diffItem.kind === 'E' || diffItem.kind === 'N') && diffItem.path.length > 0) {
			var _json = _parsedJsonDiff;
			for(key of diffItem.path) {
				if (!_json.hasOwnProperty(key)) {
					_json[key] = (diffItem.path.indexOf(key) === (diffItem.path.length - 1)) ? diffItem.rhs : {};
					_json = _json[key];
				} else {
					_json = _json[key];
				}
			}
		}
	}

	return _parsedJsonDiff;
}

function mergeJsonDelta() {
	var oldJsonString = $('#old-json').val(),
		newJsonString = $('#new-json').val(),
		_oldJson = validateJson(oldJsonString),
		_newJson = validateJson(newJsonString);

		if (!checkJsonForWarningsAndErrors(oldJsonString, newJsonString, _oldJson, _newJson)) {
			return false;
		}

		var _mergedJson = JSON.stringify(R.mergeDeepRight(_oldJson, _newJson), null, 2);

		$('#result-output').val(_mergedJson);
		showOutput();
}

function goBack() {
	$('#text-output').addClass('zoomOut');
	setTimeout(function() {
		$('#text-output').hide();
		$('#text-input').show();
		$('#text-output').removeClass('zoomOut');
	}, 500);
}

function showToast(toastType) {
	// to stop multiple toasts at a time
	if ($('.toast').hasClass('show')) {
		return false;
	}

	$('#toast-header').text(toaster[toastType].header);
	$('#toast-body').text(toaster[toastType].body);
	$('#toast-body').css('color', toaster[toastType].color);
	$('#error-toast').addClass('show');
	$('#error-toast').addClass('swing');
	setTimeout(closeError, 5000);
}

function copyToClipboard() {
   var text = $('#result-output').val(),
	   el = document.createElement('textarea');
   el.value = text;
   el.setAttribute('readonly', '');
   el.setAttribute('class', 'hidden');
   document.body.appendChild(el);
   el.select();
   document.execCommand('copy');
   document.body.removeChild(el);
   showToast('copy');
}

function initTooltips() {
	$(function () {
	  $('[data-toggle="tooltip"]').tooltip()
	});
};

function showOutput() {
	$('#text-input').addClass('zoomOut');
	setTimeout(function() {
		$('#text-input').hide();
		$('#text-output').show();
		$('#text-input').removeClass('zoomOut');
	}, 500);
}

function togglePage(id, element) {
	$('.nav-link').removeClass('active');
	$(element).addClass('active');
	$('.tab-content.active').removeClass('active');
	$('#' + id).addClass('active');
}

// backend translations

function _parseAndConvertToJson(propString) {
	var _parsedProps = {};

	_propLines = propString.split('\n');
	_propsWithoutComments = _removeComments(_propLines);
	for(prop of _propsWithoutComments) {
		var _split = prop.split('=');
		_parsedProps[_split[0]] = _split.length === 1 ? '' : _split.slice(1, _split.length).join('=');
	}

	return _parsedProps;
}

function _removeComments(propLines) {
	return _propLines.filter(function(prop) {
		return prop.indexOf('#') !== 0;
	})
}

function checkPropsForWarningsAndErrors(oldPropString, newPropString, oldProp, newProp) {
	if (!newPropString.trim()) {
			showToast('emptyProp');
			return false;
		}
		
		$('textarea').removeClass('highlight-red');

		return true;
}

function _covertJsonToProp(json) {
	props = '';
	for(key of Object.keys(json)) {
		props += key + '=' + json[key] + '\n';
	};

	return props;
}

function findPropDelta() {
	var _oldPropString = $('#old-properties').val(),
		_newPropString = $('#new-properties').val(),
		_oldProp = _parseAndConvertToJson(_oldPropString),
		_newProp = _parseAndConvertToJson(_newPropString);

	if(!checkPropsForWarningsAndErrors(_oldPropString, _oldPropString, _oldProp, _newProp)) {
		return false
	}

	var _propDifference = DeepDiff(_oldProp, _newProp); // Plugin returns json difference;

		if (!_propDifference || !_propDifference.length) {
			showToast('nodiffProp');
		}

		var _parsedPropJsonDifference = _parseJsonDifference(_propDifference),
			_parsedPropDifference = _covertJsonToProp(_parsedPropJsonDifference);

		

		$('#result-output').val(_parsedPropDifference);
		showOutput();
}

function mergePropDelta() {
	var _oldPropString = $('#old-properties').val(),
		_newPropString = $('#new-properties').val(),
		_oldProp = _parseAndConvertToJson(_oldPropString),
		_newProp = _parseAndConvertToJson(_newPropString);

	if(!checkPropsForWarningsAndErrors(_oldPropString, _oldPropString, _oldProp, _newProp)) {
		return false
	}

	var _mergedProps = _covertJsonToProp(R.mergeDeepRight(_oldProp, _newProp));
	
	$('#result-output').val(_mergedProps);
	showOutput();

}

function scrollToDiv(id) {
	$('body').animate({
		scrollTop: $('#' + id).offset().top,
	}, {
		duration: 'slow',
		easing:'linear'
	});
}

initTooltips();