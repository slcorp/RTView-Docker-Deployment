//
// RTView Proxy Server - Telemetry Simulation Connector
//
// Create and seerver simulated telemetry data defined in an excel spreadsheet
//
// Configure the application to make use of the rtview-proxy-server package
// and reference it using the variable name 'rtvproxy'

var rtvproxy = require('rtview-proxy-server')();

// Enable/disable tracing of calls to rtview-proxy-server
rtvproxy.set_verbose(false);

// Enable/disable local tracing for calls within this file
var verbose = false;

// packages used to load and parse excel spreadsheet
var XMLHttpRequest = require('xhr2').XMLHttpRequest;
var xlsx = require('xlsx');


// *************************************************************************
// RTVIEW PROXY OVERRIDES

// This code is provided to compensate for bugs or omissions in 
// the rtview-proxy npm package.  Can be removed once rtview-proxy is updated

// local copies of these maps, for access here
var cacheMap = {};
var metadataMap = {};

// Override create cache method to store cacheMap and metatdataMap locally

function create_datacache (cacheName, properties, metadata) {
    if (cacheName === null) return;    
    metadataMap[cacheName] = metadata;  
    cacheMap[cacheName] = properties;
    rtvproxy.create_datacache(cacheName, properties, metadata);
}

// Obtain full metadata for the given cache

function get_full_metadata (cacheName, tableName) {
   
    properties = cacheMap[cacheName]
    metadata = metadataMap[cacheName]
	if (!properties || !metadata) {
		console.log('ERROR: cannot find cache definition: ' + cacheName);
        return callback(res, null, query);
	}
    indexColArray = properties.indexColumnNames.split(';')
    histColArray = properties.historyColumnNames.split(';')
    if (histColArray === undefined || histColArray === null) histColArray = []
     
    // convert metadata to long format
    metadata2 = []; if (metadata !== null) {
        for (var i = 0; i < metadata.length; i++) {
            for (var colName in metadata[i]) {  
                if (tableName == 'current') {
                    metadata2.push( { "name": colName, "type": metadata[i][colName] } )
                } else {
                    if (colName == 'time_stamp' || indexColArray.includes(colName) || (histColArray.length == 0 || histColArray.includes(colName))) {
                        metadata2.push( { "name": colName, "type": metadata[i][colName] } )
                    }
                }
            }
        }
    }
    return metadata2;
}


// ***************************************************************
// INITIALIZE

// Initialize the Proxy Server by defining caches for foreign data
// NOTE: this set of caches is fixed and pre-defined for the Telemetry Simulation Application

var cacheName = "CRONUS";

create_datacache(cacheName,
//rtvproxy.create_datacache(cacheName,
{   // cache properties
    "indexColumnNames": "Dataset",
    "historyColumnNames": "Metric 1;Metric 2;Metric 3;Metric 4;Metric 5;Metric 6",
    "condenseRowsGroupBy": "Metric 1:average;Metric 2:average;Metric 3:average;Metric 4:average;Metric 5:average;Metric 6:average"
},[ // column metadata
    { "time_stamp": "date" },
	{ "Metric 1": "double" },
	{ "Metric 2": "double" },
	{ "Metric 3": "double" },
	{ "Metric 4": "double" },
	{ "Metric 5": "double" },
	{ "Metric 6": "double" },
	{ "Dataset": "string"}
]);

var cacheName = "ADCO";

create_datacache(cacheName,
//rtvproxy.create_datacache(cacheName,
{   // cache properties
    "indexColumnNames": "Dataset",
    "historyColumnNames": "Metric 7;Metric 8;Metric 9",
    "condenseRowsGroupBy": "Metric 7:average;Metric 8:average;Metric 9:average"
},[ // column metadata
    { "time_stamp": "date" },
	{ "Metric 7": "double" },
	{ "Metric 8": "double" },
	{ "Metric 9": "double" },
	{ "Dataset": "string"}
]);

var cacheName = "SPARTAN";

create_datacache(cacheName,
//rtvproxy.create_datacache(cacheName,
{   // cache properties
    "indexColumnNames": "Dataset",
    "historyColumnNames": "Metric 10;Metric 11;Metric 12;Metric 13;Metric 14;Metric 15",
    "condenseRowsGroupBy": "Metric 10:average;Metric 11;average;Metric 12:average;Metric 13:average;Metric 14:average;Metric 15:average"
},[ // column metadata
    { "time_stamp": "date" },
	{ "Metric 10": "double" },
	{ "Metric 11": "double" },
	{ "Metric 12": "double" },
	{ "Metric 13": "double" },
	{ "Metric 14": "double" },
	{ "Metric 15": "double" },
	{ "Dataset": "string"}
]);


// query the remote service for data defined by the cacheName, tableName and query parameters
// This is a VERY simplistic implementation that returns synchronously
// In a real system, the data are returned asynchronously; see other examples

var getData = function (cacheName, tableName, res, query, result, callback) {

    // create an RTView JSON tabular data object based on requested cache and table names
    // by querying the foreign service
    switch(cacheName) {

        default:
            query.cache = cacheName;  // save cache name on query for downstream use
            return getTelemetryWorksheet(tableName, res, query, result, callback);
    }
    
    // pass the result back to RTView via the callback
    callback(res, result, query);
}

// *******************************************************************
// Telemetry Connector - MAIN PROGRAM

console.log('\nRTView-Telemetry Connector (API Proxy Server)\n');

// Launch the RTView Proxy Server
// Pass in a custom data handler for returning data (a function named getData in this example)

rtvproxy.run(getData);


// ***********************************************************************
// CUSTOM DATA HANDLERS

// Start out with empty dictionary of saved workbooks keyed by dataset
var saved_workbooks = { };
var saved_workbook_times = { };
var last_check_time = 0;
var check_interval = 30000;


// ********************************************************************
// TELEMETRY WORKSHEET DATA

// Query Telemetry Data (specialized for simulation purposes)
// The dataset parameter specifies an Excel spreadsheet containing a table by the name of requested cache

var getTelemetryWorksheet = function(tableName, res, query, result, callback) {

    // the cache name not normally on the query, added it in the initial call
    var name = query.cache;
    if (verbose) console.log('==> getTelemetryWorksheet(), cache: ' + name + ' table: ' + tableName);
    
   // get paging parameters from the query
    rp = query.rp; pn = query.pn;
    dir = undefined; column = undefined;
    if (rp != undefined && rp > 0) {
        if (verbose) console.log('  ... rp: ' + rp + ' pn: ' + pn);
        // sort parameters
        if (query.jsortArray) {           
            dir = query.jsortArray[0].dir
            column = query.jsortArray[0].column
            //if (verbose) console.log('  ... dir: ' + dir + ' column: ' + column);
            if (verbose) console.log('  ... query.jsortArray: ' + JSON.stringify(query.jsortArray));
        }
    }
    
    // obtain time range parameters from the query
    var tr = Number(getValue(query,'tr',0))*1000;
    var dateTo = Number(getValue(query, 'te', (new Date()).getTime()));
    var dateFrom = Number(getValue(query, 'tb', dateTo - (tr > 0 ? tr : 10000)));
    if (verbose) console.log('  ... tr: ' + tr + ' from: ' + dateFrom + ' to: ' + dateTo);
    
    // if dateTo is < 0, use current time
    if (dateTo <= 0) {
        dateTo = Number((new Date()).getTime());
        dateTo = new Date(dateTo);
    }
    
	// get 'Dataset' filter from query; 
    var dataset = '';
    if (query.fmap) { 
		fmap = query.fmap;   
		dataset = fmap.Dataset;	
	}

    // construct a urlInfo object for downstream processing
    urlInfo = { res:res, result:result, tableName:tableName, query:query, name:name, dataset:dataset,
                    tr:tr, dateFrom:dateFrom, dateTo:dateTo, rp:rp, pn:pn, dir:dir, column:column, jsortArray:query.jsortArray };

    // if no dataset specified, return now                   
    if (!dataset || dataset == '') {
        if (verbose) console.log('  ... no dataset specified, no data');
        callback(res, result, query);
        return;
    }
    
    if (verbose) console.log('  ... dataset: ' + dataset);
        
    var saved_workbook = null;    
    var saved_workbook_time = null;  
    
    if (dataset) {
        saved_workbook = saved_workbooks[dataset];
        saved_workbook_time = saved_workbook_times[dataset];
    }
    
    // if workbook found, we can just use the saved instance
    if (saved_workbook) {
        if (verbose) console.log('  ... found SAVED workbook!');
        
        //process_workbook(saved_workbook, urlInfo, callback);
        
        // even if workbook saved, periodically make HEAD query to determine if 
        // timestamp of the file has changed
        
        // DEVNOTE: this code needs rework: it is simply clearing the saved worksheet
        // so that the next time we query it, it will load from url.
        // But this means that the first query after the dataset changed will be wrong !
        
        workbook_changed = false;
        
        if (Date.now() > (last_check_time + check_interval)) {
            if (verbose) console.log('*********** checking for dataset changed');
            
            // make request for the HEAD or XLS file specified by the dataset 
            var req = new XMLHttpRequest();
            req.open("HEAD", dataset, true);
            req.onload = function (e) {
                workbook_time = req.getResponseHeader('last-modified');
                if (verbose) console.log('... checking HEAD response: ' + workbook_time + ' dataset: ' + dataset);
                if (workbook_time != saved_workbook_time) {
                    console.log('INFO: ####### dataset time changed: ' + dataset);
                    
                    delete saved_workbooks[dataset];
                    saved_workbook = null;
                }
                
                // process saved workbook if not changed
                //process_workbook(saved_workbook, urlInfo, callback);
            }
            try {
                req.send();
            } catch (ex) {
                if (verbose) console.log('... error in XHR send for HEAD');
            }
            last_check_time = Date.now();
        }
        //} else {
            if (verbose) console.log('... doing normal update on saved workbook');
        
            // process saved workbook if not checking
            process_workbook(saved_workbook, urlInfo, callback);
                
            // else remove from saved list and trigger another load
            /*
            } else {  
                delete saved_workbooks[dataset];
                saved_workbook = null;
            }
            */            
       // }        
    }
    
    // if not found, then load it from the given dataset URL
    if (!saved_workbook) {
        if (verbose) console.log('  ... saved workbook NOT FOUND, loading dataset');
        
        load_and_process_workbook(dataset, urlInfo, callback);
    }
}

// Load the workbook and then process it
var load_and_process_workbook = function(dataset, urlInfo, callback) {

    // always print this info message
    if (verbose) console.log('INFO: attempt loading workbook at: ' + dataset);
    
    // make request for the XLS file specified by the dataset parameter
    var req = new XMLHttpRequest();
    req.open("GET", dataset, true);
    req.responseType = 'arraybuffer';
    
    req.onload = getTelemetryWorksheetHandler(urlInfo);
    
    req.onerror = function(e) {
        console.log('ERROR: XHR request for dataset: ' + dataset);
        var error = 'Error: cannot download xls file: ' + urlInfo.dataset;
        urlInfo.res.queryStatus = response ? response.statusCode : 0;
        urlInfo.res.queryStatusText = error;
        err = 'Cannot load workbook: ' + dataset;
        console.log('ERROR: query for Workbook: ' + err + ' ' + urlInfo.tableName);	
        callback(urlInfo.res, urlInfo.result, urlInfo.query);
    }
    
    if (verbose) console.log('  ... requesting XHR load of dataset');
    try {
        req.send();
    } catch (ex) {
        if (verbose) console.log('  ... error in XHR req.send()');
        callback(urlInfo.res, urlInfo.result, urlInfo.query);
    }

    // create a handler with closure for this request
    function getTelemetryWorksheetHandler(urlInfo) {
        return function(response){

            // retrieve data as an array that xlsx can process
            var data = new Uint8Array(req.response);
            
            // always print this info message
            console.log('INFO: loaded workbook at: ' + dataset);
    
            if (verbose) console.log('    ... loaded dataset, length: ' + data.length);  
            
            workbook_time = req.getResponseHeader('last-modified');
            if (verbose) console.log('    ... HEAD response: ' + workbook_time); 
            saved_workbook_times[dataset] = workbook_time;                
                      
            urlInfo.res.queryStatus = 0;
            urlInfo.res.queryStatusText = 'OK';
            
            var workbook;
            
            try {
                workbook = xlsx.read(data, {type: 'array'});
                //console.log('... workbook: ' + JSON.stringify(workbook, 0, 2));
                
                saved_workbooks[dataset] = workbook;

            } catch (ex) { 
                var error = 'Error: cannot parse xls file: ' + urlInfo.dataset;
                console.log('ERROR: exception: ' + ex.message);        
              
                urlInfo.res.queryStatus = response ? response.statusCode : 0;
                urlInfo.res.queryStatusText = error;
                err = '';
                console.log('ERROR: query failed for table: ' + err + ' ' + urlInfo.tableName);	
                callback(urlInfo.res, urlInfo.result, urlInfo.query);
                return;
            }
            
            process_workbook(workbook, urlInfo, callback);
        };  
    }
}

// Process contents of a workbook; parse it for requested sheet           
 var process_workbook = function(workbook, urlInfo, callback) {
    
    // find the specified worksheet in this workbook
    var sheetname = urlInfo.name;
    var sheets = workbook.Sheets;
    var sheet = workbook.Sheets[sheetname];
    
    if (verbose) { 
        console.log('  ... sheet names: ');
        var keys = Object.keys(workbook.SheetNames);
        for (var key of keys) { console.log('        ' + workbook.SheetNames[key]); }
        console.log('  ... getting sheet: ' + sheetname);
        //console.log('  ... sheet: ' + JSON.stringify(sheet, 0, 2));
    }
    
    var dtable = xlsx.utils.sheet_to_json(sheet, {header:1});
    //console.log('======= stable JSON:' + JSON.stringify(dtable, 0, 2));
    
    // create an empty array of data rows
    rtvdata = [];

    // process data if we have more than one row 
    if (dtable) {
        if (verbose) console.log('  ... # rows: ' + dtable.length);      
        if (dtable.length > 0) {
            if (verbose) console.log('  ... # cols: ' + dtable[0].length);
            
            // process 'current' data
            if (urlInfo.tableName == 'current') {
                telemetryWorksheetCurrent(dtable, rtvdata, urlInfo, urlInfo.dataset);
            
            } else {
                telemetryWorksheetHistory(dtable, rtvdata, urlInfo, urlInfo.dataset, urlInfo.tr, urlInfo.dateTo);                
            }
        }
    }
    
    urlInfo.result.data = rtvdata;
    
    urlInfo.res.queryStatus = 0;
    urlInfo.res.queryStatusText = 'OK';
    
    if (verbose) console.log('  ... getTelemetryWorksheet exec_time: ' + (Date.now() - urlInfo.dateTo) + '  ' +
        urlInfo.name + '.' + urlInfo.tableName + ' ' + urlInfo.result.data.length + ' rows\n'); //  
    //console.log('  ... returned: ' + JSON.stringify(urlInfo.result.data)+'\n');

    callback(urlInfo.res, urlInfo.result, urlInfo.query);
}

var telemetryWorksheetCurrent = function(dtable, rtvdata, urlInfo, dataset) {
    if (!dtable) return;

    var istart = 1;
	var colnames = dtable[istart];
    
    // Skip over first column if blank
    //console.log('... colnames: ' + JSON.stringify(colnames));
    column = 1;
    if (!colnames[0]) {
        //console.log('... column 0 is blank !');
        column++;
    }

    // calculate time modulo 5400 seconds as index into seconds table
    var tx = getModuloTimeIndex(5400, Date.now());
    
    // use modulo time as offset into table
    var drow = dtable[istart + 1 + tx.tmod];
      
    //create a row to add to rtvdata table, and insert timestamp
    row = [];
    row.push(tx.t0);

    // loop over valid cells and copy to rtvdata table
    for (var i = column; i < colnames.length; i++) {
        row.push(drow[i]);
    }
    
    // Determine paging paramaters (only returning one row in this case)
    calcPageParameters(urlInfo, 1);
    firstRow = urlInfo.result.paging.firstRow; lastRow = urlInfo.result.paging.lastRow;
    
    // add the dataset column
    row.push(dataset);
     
    urlInfo.result.paging = { totalRowCount:1, firstRow:0, lastRow:0 };

	rtvdata.push(row);
}
 
var telemetryWorksheetHistory = function(dtable, rtvdata, urlInfo, dataset, tr, dateTo) {
    if (!dtable) return;
	
    var istart = 1;
	var colnames = dtable[istart];

    // Skip over first column if blank
    //console.log('... colnames: ' + JSON.stringify(colnames));
    column = 1;
    if (!colnames[0]) {
        //console.log('... column 0 is blank !');
        column++;
    }
    
    // calculate time modulo 5400 seconds as index into seconds table
    var tx = getModuloTimeIndex(5400, dateTo);
    var t0 = tx.t0;
    var tmod = tx.tmod;
    
    //numHistoryRows = 300;
    numHistoryRows = tr / 1000;
    if (numHistoryRows <= 0)
        numHistoryRows = 300;
    
    if (verbose) console.log('    ... calc numHistoryRows: ' + numHistoryRows);
    
    // go back in time and loop through requested time range
    // copy one row at a time incrementing index into table
    t0 = t0 - 1000 * (numHistoryRows - 1);
    tmod = tmod - (numHistoryRows - 1);
    
    while (tmod < 0) {
        tmod += 5400;
    }
    
    // Determine paging paramaters
    calcPageParameters(urlInfo, numHistoryRows);
    firstRow = urlInfo.result.paging.firstRow; lastRow = urlInfo.result.paging.lastRow;

    // target array = rtvdata by default; if sorting, make target temp array
    var target = rtvdata;
    if (urlInfo.jsortArray) {
        target = [];
    }

    for (j = 0; j < numHistoryRows; j++) {
        
        //if (verbose) console.log('... t0: ' + t0 + ' tmod: ' + tmod);
        
        // use modulo time as offset into table
        var drow = dtable[istart + 1 + tmod];
        
        if (!drow) {
            console.log('ERROR: invalid drow in query, tmod: ' + tmod);
            continue;
        }
          
        //create a row to add to target table, and insert timestamp
        row = [];
        row.push(t0);

        // loop over valid cells and copy to target table
        for (var i = column; i < colnames.length; i++) {
            row.push(drow[i]);
        }
        
        // add the dataset column
        row.push(dataset);    /// do not include dataset in history ?

        // if sorting copy all rows (to temp target)
        if (urlInfo.jsortArray) {
            target.push(row);
            
        // if not sorting, skip rows not in page
        } else {
            if (j >= firstRow && j <= lastRow) {
                target.push(row);
            }
        }
        
        t0 += 1000;
        tmod += 1;
        
        if (tmod >= 5400) {
            tmod -= 5400;
        }
    }
    //console.log('... after initial copy, target: ' + target);

    // sort based on given params: column names + direction
    if (urlInfo.jsortArray) {
        
        // get expanded metadata to pass to sort function
        metadata2 = get_full_metadata(urlInfo.name, urlInfo.tableName);
        
        // do multi-column sort on a table constructed from metadata and rtvdata
        var tbl = { metadata: metadata2, data:target }
        tableSort(tbl, urlInfo.jsortArray);
        
        //console.log('... AFTER sort: ' + JSON.stringify(target)); 
        
        // then copy on rows in the current page to rtvdata
        for (var j = 0; j < numHistoryRows; j++) {
            var row = target[j];
             if (j >= firstRow && j <= lastRow) {
                rtvdata.push(row);
            }
        }
        //console.log('... AFTER copy' + JSON.stringify(rtvdata));
    }
}

// calculate time modulo 'numrows' seconds as index into seconds table
var getModuloTimeIndex = function(numrows, dateTo) { 
 
    // get floor of current second
	var t = Date.now();
    if (dateTo > 0) t = dateTo;
    
    var t0 = 1000 * Math.floor(t / 1000);
    if (verbose) console.log('    ... t0 = ' + t + ' ' + t0);
    
    // get index into seconds table modulo 'numrows'
    var tmod = t0 % (numrows * 1000);
    tmod /= 1000; tmod = tmod | 0;
    if (verbose) console.log('    ... tmod = ' + tmod);
    
    return { t0:t0, tmod:tmod };
}

// Determine paging parameters from input rp, pn, and number of rows in table
// Create page info object with firstRow and lastRow; store on the urlInfo object

var calcPageParameters = function (urlInfo, totalRowCount) { 
    
    if (verbose) console.log('    ... passed in... rowcount: ' + totalRowCount + ' rp: ' + urlInfo.rp + ' pn: ' + urlInfo.pn);
    
    // return whole page by default
    firstRow = 0; lastRow = totalRowCount - 1;
    
    // if range is provided, calculaate first and last row index
    if (urlInfo.rp !== undefined && urlInfo.rp > 0) {
        firstRow = urlInfo.rp * (urlInfo.pn - 1);
        lastRow = (urlInfo.rp * urlInfo.pn) -1;
        if (lastRow >= totalRowCount) lastRow = totalRowCount - 1;
        if (verbose) console.log('    ... calc page params: totalRowCount: ' + totalRowCount + ' firstRow: ' + firstRow + ' lastRow: ' + lastRow);
    }
    if (verbose) console.log('    ... calculated page params, firstRow: ' + firstRow + ' lastRow: ' + lastRow);
    
    // return this info in the info object
    urlInfo.result.paging = { totalRowCount:totalRowCount, firstRow:firstRow, lastRow:lastRow };
}
    
// **********************************************************************
// Utility functions for variables and support

var hasProperty = function(obj,prop) {
    return Object.prototype.hasOwnProperty.call(obj,prop);
}

var getValue = function(obj,prop,default_value) {
    if(hasProperty(obj,prop))
        return obj[prop];
    else
        return default_value;
}

var isNumber = function(n) {
    return typeof n === 'number' && !isNaN(n);
}   

// Sort an rtview datatable by cols and direction
// sortCols is an array of {name, dir} objects where dir is 'asc' or 'desc'
// DEVNOTE: these functions are copied directly from rtweb/js/rtv/dac/data_tables.js/rtv/dac/data_tables
// but with this converted to first argument

var tableSort = function (tbl, sortCols) {
    //var tbl = this;
    // sortCols is an array of {name, dir} objects where dir is 'asc' or 'desc'
    if (!sortCols || !sortCols.length)
        return;
    var scols = [];
    sortCols.forEach(function(col) {
        var colname = col.name || col.column;
        //var colnum = tbl.getColumnIndex(colname);
        var colnum = getColumnIndex(tbl, colname);
        if (colnum > -1) {
            scols.push({
                colnum: colnum,
                dir: col.dir === 'desc' ? -1 : 1,
                isStr: tbl.metadata[colnum].type === 'string'
            });
        }
    });
    if (!scols.length)
        return;
    var c, col, val1, val2, cmp, dir;
    tbl.data.sort(function(row1, row2) {
        cmp = 0;
        for (c = 0; c < scols.length; ++c) {
            col = scols[c];
            val1 = row1[col.colnum];
            val2 = row2[col.colnum];
            dir = col.dir;
            if (val1 === val2)
                continue;
            if (col.isStr) {
                if (!val1)
                    cmp = -1;
                else if (!val2)
                    cmp = 1;
                else
                    cmp = val1.localeCompare(val2);
            } else {
                cmp = val1 - val2;
            }
            if (cmp !== 0)
                break;
        }
        return cmp * dir;
    });
}

var getColumnIndex = function (tbl, name) {
    //var tbl = this;
    var cols = tbl.metadata;
    if (!cols || !name)
        return -1;
    for (var i = 0; i < cols.length; ++i) {
        if (name === cols[i].name) {
            return i;
        }
    }
    return -1;
}
