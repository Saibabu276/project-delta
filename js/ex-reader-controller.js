var app = angular.module('delta-app', []);

app.controller('scriptGenerationController', function($scope, $sce) {

	$scope.isEmpty = function(variable) {
		return ($scope[variable] === '');
	}

	$scope.updateFields = function() {
		$scope.updateValueArray = [];
		for(var i=0; i<$scope.updateFieldsNo; i++) {
			$scope.updateValueArray.push({
				'fieldName':'',
				'fieldValue':''
			});
		}
	}

	$scope.updatePredicates = function() {
		$scope.updatePredicatesArray = [];
		for(var i=0; i<$scope.updatePredicatesNo; i++) {
			$scope.updatePredicatesArray.push({
				'fieldName':'',
			});
		}
	}

	$scope.addRerunnableScripts = function() {
		$scope.reRunnableScriptsArray = [];
		for(var i=0; i<$scope.rerunnableFields; i++) {
			$scope.reRunnableScriptsArray.push({
				'fieldName':'',
			});
		}
	}

	$scope.addInsertColumns = function() {
		$scope.insertColumns = [];
		for(var i=0; i<$scope.insertColumnNo; i++) {
			$scope.insertColumns.push({
				'fieldName':'',
				'fieldValue':''
			});
		}
	}

	function _initiateFileReader() {
		var oFileIn;

		$(function() {
		    oFileIn = document.getElementById('my_file_input');
		    if(oFileIn.addEventListener) {
		        oFileIn.addEventListener('change', filePicked, false);
		    }
		});


		function filePicked(oEvent) {
		    // Get The File From The Input
		    var oFile = oEvent.target.files[0];
		    var sFilename = oFile.name;
		    // Create A File Reader HTML5
		    var reader = new FileReader();
		    
		    // Ready The Event For When A File Gets Selected
		    reader.onload = function(e) {
		        var data = e.target.result;
		        var cfb = XLS.CFB.read(data, {type: 'binary'});
		        var wb = XLS.parse_xlscfb(cfb);
		        // Loop Over Each Sheet
		        wb.SheetNames.forEach(function(sheetName) {
		            // Obtain The Current Row As CSV   
		            $scope.xlData = XLS.utils.sheet_to_json(wb.Sheets[sheetName]);
		            var columns = XLS.utils.sheet_to_formulae(wb.Sheets[sheetName]);
		            var index=0;
		            $scope.columns = [];
		            for(var i=0; i<columns.length; i++){
		            	if(columns[i].substr(0,2) === 'A2') {
		            		index = i;
		            		break;
		            	}
		            };
		            for(var i=0; i<index; i++) {
		            	$scope.columns.push(columns[i].substr(4));
		            }  
		        });
		    };
		    
		    // Tell JS To Start Reading The File.. You could delay this if desired
		    reader.readAsBinaryString(oFile);
		}
	}
	function _prepareQuery(row) {
		var _prefix = (($scope.scriptType === 'insert')?'insert into\n':'update\n') + $scope.tableName + '\n',
			_updateString = '',
			_predicateString = '',
			_insertString = '',
			_rerunnableString = '';

		if($scope.scriptType === 'insert') {
			_insertString = _prepareInsertString(row);
			if($scope.isRerunnable) {
				_rerunnableString = _prepareRerunnableString(row);
				$scope.rerunnableQueries.push(_rerunnableString);
			}
			$scope.queryList.push(_prefix + _insertString + ';');
		}
		else if($scope.scriptType === 'update') {
			if($scope.updateFieldsNo > 0) {
				_updateString = _prepareUpdateString(row);
			}
			if($scope.updatePredicatesNo > 0) {
				_predicateString = _preparePredicateString(row)
			}
			$scope.queryList.push(_prefix + _updateString + _predicateString + ';');
		}
	}

	function _prepareUpdateString(row) {
		var str = ' set ';
		angular.forEach($scope.updateValueArray, function(field, index){
			if(index > 0) {
				str += ',\n';
			}
			str += field.fieldName + '=\'' + row[field.fieldValue].split("'").join("''") + '\'';
		});
		return str;
	}


	function _preparePredicateString(row) {
		var str = ' where ';
		angular.forEach($scope.updatePredicatesArray, function(field, index){
			if(index > 0) {
				str += ' and ';
			}
			str += field.fieldName + '=\'' + row[field.fieldName] + '\'';
		});
		return str;
	}

	function _prepareRerunnableString(row) {
		var str = 'delete from ' + $scope.tableName + ' where ';
		angular.forEach($scope.reRunnableScriptsArray, function(field, index){
			if(index > 0) {
				str += ' and ';
			}
			str += field.fieldName + '=\'' + row[field.fieldName] + '\'';
		});
		return str + ';';
	}
	
	function _prepareInsertString(row) {
		var str='',
			columnStr = '(\n',
			valueStr = 'values\n(\n'
		angular.forEach($scope.insertColumns, function(field, index) {
			if(!!row[field.fieldValue]) {
				if(index > 0) {
					columnStr += ',\n';
					valueStr += ',\n';
				}
				columnStr += field.fieldName;
				if(row[field.fieldValue].indexOf('\n') !== -1) {
					row[field.fieldValue] = row[field.fieldValue].split('\n').join('');
				}
				if(row[field.fieldValue] === 'SYSDATE')
					valueStr += row[field.fieldValue];
				else
					valueStr += '\'' + row[field.fieldValue].split("'").join("''") + '\'';
			}
		});
		str += columnStr + '\n)\n' + valueStr + '\n)';
		return str;
	}

	$scope.generateQueries = function() {
		$scope.totalQueries = '';
		$scope.queryList = [];
		$scope.rerunnableQueries = []
		for(var i=0; i<$scope.xlData.length; i++) {
			_prepareQuery($scope.xlData[i]);
		}
		$scope.totalQueries = $scope.rerunnableQueries.join('\n') + '\n' + $scope.queryList.join('\n');
		$('#result-output').val($scope.totalQueries);
		showOutput();
	}
	
	$scope.changeScriptType = function() {
		if($scope.scriptType === 'update') {
			$scope.insertColumnNo = '';
		}
		else {
			$scope.updateFieldsNo = '';
		}
	}

	$scope.isColumnSelected = function(columnName, refArray) {
		var columnIndex = -1;

		columnIndex = _.findIndex($scope[refArray], function(column){
			return column.fieldName === columnName;
		});

		return (columnIndex !== -1);
	}

	$scope.selectAllColumns = function() {
		angular.forEach($scope.insertColumns, function(field, index){
			if(!!$scope.columns[index]) {
				field.fieldName = $scope.columns[index];
				field.fieldValue = $scope.columns[index];
			}
		});
	}

	$scope.copyQueries = function() {
		$('#queries').select();
		document.execCommand('Copy');
		alert('All Queries Copied to clipboard');
	}

	function _init() {
		$scope.scriptType = '';
		$scope.tableName = '';
		$scope.updateFieldsNo = '';
		$scope.updateValueArray = [];
		$scope.updatePredicatesNo = '';
		$scope.updatePredicatesArray = [];
		$scope.queryList = [];
		$scope.insertColumns = [];
		$scope.insertColumnNo = '';
		$scope.isRerunnable = true;
		$scope.rerunnableFields= '';
		$scope.reRunnableScriptsArray = [];
		$scope.rerunnableQueries = [];
	}
	function sortByKpiKey(a,b) {
		return a-b;
	}
	_init();
	_initiateFileReader();

});