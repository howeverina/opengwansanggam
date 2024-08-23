const SECRET2 = 'y4hyRoJ'

function getQueryStringObject() {
    var a = window.location.search.substr(1).split('&');
    if (a == "") return {};
    var b = {};
    for (var i = 0; i < a.length; ++i) {
        var p = a[i].split('=', 2);
        if (p.length == 1)
            b[p[0]] = "";
        else
            b[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
    }
    return b;
}

function changePostDisabled(e) {
    document.querySelector('#wordcount').innerText = e.value.length
    if (e.value != '' ) {
        document.querySelector('#post-button').disabled = false
    } else {
        document.querySelector('#post-button').disabled = true
    }
}

var qs = getQueryStringObject()
var docs = qs.d
var page = qs.p
var edit = qs.ed
var title = ''

if (!docs && !edit) {
    title = '시트1'
} else if (docs != undefined) {
    title = docs
} else if (edit != '') {
    title = edit
}
document.querySelector('#logo').innerHTML = WIKI_TITLE
const SECRET3 = 'Jkjn4rM'

document.querySelector('#search-button').href = './'
document.querySelector('#search-input').addEventListener("input", (e) => {
    document.querySelector('#search-button').href= "./?d="+document.querySelector('#search-input').value
})

function wikiParse(text) {
    text = text.replace(/\n/gm, '')
    text = text.replace(/\[\[(.+)\|(.+)\]\]/gm, '[$1](./?d=$2)')
    text = text.replace(/\[\[(.+)\]\]/gm, '[$1](./?d=$1)')
    var markdown = marked.parse(text)
    markdown = markdown.replace(/\\n\\n/gm, '</p><p>')
    markdown = markdown = markdown.replace(/\\n\\n/gm, '</p><p>')
    .replace(/\\n/gm, '<br>')
    return markdown
}

/* exported gapiLoaded */
    /* exported gisLoaded */
    /* exported handleAuthClick */
    /* exported handleSignoutClick */

    // TODO(developer): Set to client ID and API key from the Developer Console
const API_KEY = SECRET1 + '-' + SECRET2 + '_' + SECRET3;

    // Discovery doc URL for APIs used by the quickstart
const DISCOVERY_DOC = 'https://sheets.googleapis.com/$discovery/rest?version=v4';

    // Authorization scopes required by the API; multiple scopes can be
    // included, separated by spaces.
    const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';

    let tokenClient;
    let gapiInited = false;
    let gisInited = false;

    document.getElementById('authorize_button').style.visibility = 'hidden';
    document.getElementById('signout_button').style.visibility = 'hidden';

    /**
     * Callback after api.js is loaded.
     */
function gapiLoaded() {
    gapi.load('client', initializeGapiClient);
}



    /**
     * Callback after the API client is loaded. Loads the
     * discovery doc to initialize the API.
     */
async function initializeGapiClient() {
    await gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: [DISCOVERY_DOC],
    });
    gapiInited = true;
    maybeEnableButtons();
    listMajors(title)
}

    /**
     * Callback after Google Identity Services are loaded.
     */
function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        redirect_uri: 'https://wiki.rongo.moe/',
        scope: SCOPES,
        callback: 'https://wiki.rongo.moe/', // defined later
    });
    gisInited = true;
    maybeEnableButtons();
}

function handleEditClick() {
    location.href="./?ed="+title
}
    /**
     * Enables user interaction after all libraries are loaded.
     */
function maybeEnableButtons() {
    if (gapiInited && gisInited) {
        document.getElementById('authorize_button').style.visibility = 'visible';
    }
}

    /**
     *  Sign in the user upon button click.
     */
function handleAuthClick() {

    var token = localStorage.getItem('googleToken');
    if (!token) {
        location.href = './?d='+edit
    } else {
        gapi.client.setToken(JSON.parse(token))
    }

    tokenClient.callback = async (resp) => {
        if (resp.error !== undefined) {
            throw (resp);
        }
        document.getElementById('edit_button').style.visibility = 'visible';
        document.getElementById('signout_button').style.visibility = 'visible';
        document.getElementById('authorize_button').innerText = '새로고침';

        var token = JSON.stringify(gapi.client.getToken())
        localStorage.setItem('googleToken', token)

        await listMajors(title);
    };

    if ( gapi.client.getToken() === null) {
        // Prompt the user to select a Google Account and ask for consent to share their data
        // when establishing a new session.
        tokenClient.requestAccessToken({prompt: 'consent'});
        var token = JSON.stringify(gapi.client.getToken())
        localStorage.setItem('googleToken', token)
    } else {
        // Skip display of account chooser and consent dialog for an existing session.
        tokenClient.requestAccessToken({prompt: ''});
    }
}

    /**
     *  Sign out the user upon button click.
     */
function handleSignoutClick() {
    var token = localStorage.getItem('googleToken');
    if (!token) {
        var token = JSON.stringify(gapi.client.getToken());
        localStorage.setItem('googleToken', token)
    }
    if (token !== null) {
        localStorage.removeItem('googleToken')
        google.accounts.oauth2.revoke(token.access_token);
        gapi.client.setToken('');
        document.getElementById('authorize_button').innerText = '로그인';
        document.getElementById('edit_button').style.visibility = 'hidden';
        document.getElementById('signout_button').style.visibility = 'hidden';
    }
}


function postDocs(title) {
    const body = {
        "requests":{
            "addSheet":{
                "properties":{
                    "title": title
                }
            }
        }
    }

    try {
      gapi.client.sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        resource: body,
      }).then((response) => {
        location.href="./?d="+title
      });
    } catch (err) {
      document.getElementById('content').innerText += err.message;
      return;
    }
}

function editDocs(range, title, input) {
    input = input.replace(/\n/gm, '\\n')
    let values = [
      [
        range,
        new Date(),
        input
      ]
    ];
    const body = {
      values: values,
    };
    try {
      gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: title,
        valueInputOption: "RAW",
        resource: body,
      }).then((response) => {
        location.href="./?d="+title
      });
    } catch (err) {
      document.getElementById('content').innerText += err.message;
      return;
    }
  }

    /**
     * Print the names and majors of students in a sample spreadsheet:
     * https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
     */
async function listMajors(title) {
    
    let response;
    try {
        // Fetch first 10 files
        response = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: title+'!A2:C',
        });
    } catch (err) {
        if (gapi.client.getToken()) {
            location.href='./?ed='+title

            console.log('생성 화면')

            document.getElementById('doc-title').innerHTML = title+' 생성';
            document.getElementById('content').innerHTML = `<div id="post-label"><button id="post-button" onclick="postDocs('${title}')">문서 생성!</button>`;
        } else {
            document.getElementById('content').innerText = '문서 생성 권한이 없습니다.';
            return;
        }
    }
    const range = response.result;
    if (!range || !range.values || range.values.length == 0) {
        document.getElementById('content').innerText = 'No values found.';
        return;
    }
    // Flatten to string to display
    console.log(range.values)
    const output = range.values[range.values.length - 1][2]
    //const output = range.values.reduce(
        // (str, row) => `${str}${row[0]}, ${row[2]}\n`,
        // 'Name, Major:\n');
    document.getElementById('doc-title').innerHTML = title;
    document.getElementById('content').innerHTML = wikiParse(output);

    if (edit) {

        console.log('edit 화면')

        document.getElementById('doc-title').innerHTML = title+' 편집';
        document.getElementById('content').innerHTML = '<div id="post-label">'+edit+' 편집: <span id="wordcount"></span></div><textarea id="post-input" oninput="changePostDisabled(this)">'+output+`</textarea><button id="post-button" disabled="true" onclick="editDocs(${JSON.stringify(range.values.length)},'${edit}',document.querySelector('#post-input').value)">편집 완료!</button>`;
    }
}