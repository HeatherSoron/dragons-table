// This file is shared by the server and client, so it does a little dancing to work both with node's require and sane browser JS 'dump it all into the global namespace and go'.


// A valid name has the following characteristics:
// * must have at least 1 non-whitespace character (leading and trailing whitespace is stripped, internal whitespace is retained)
// * must not contain any ASCII characters mentioned below:
//     * Anything in the range 0x00-0x1F (everything before space)
//     * 0x7F (delete)
//     * '<' or '>' (to prevent embedding HTML)
//     * '&' (to prevent embedding entities)
//     * '\\' (to prevent embedding unicode)
//     * ',' or ';' (needed for argument separation)
// * must not contain any non-ascii characters except those specifically noted in the large comment block (WHITELISTED UNICODE CHARACTERS) below
// * The name is not a internally reserved name, nor equivalent to an internally reserved name (see below)

// Names are considered equivalent if both are valid, and both are identical after replacing every whitelisted unicode character with its ASCII equivalent and then lower-casing the string. Thus, foo, FOO, and Foo (with a grave accent on the first o and umlauts on the second o) are all considered equivalent names. This is to allow for significant ease of typing (such that you need not hit the shift key or know how to type the necessary accented characters).

// The following names are reserved internally and are never accepted as valid names, though they may be acceptable as targets of chat macros such as whisper
//     * unidentified player (reserved for use by connections before a name is validated)

function Name(str) {
	// strip leading/trailing whitespace
	str=str.replace(/^ */g,"").replace(/ *$/g,"");

	this.literal=str;
	this.canonical=namesInternal.canonicalForm(str);
	this.HTML=namesInternal.htmlForm(str);
}

function createName(str) {
	if( !namesInternal.isValid(str) ) {
		return null;
	}
	return new Name(str);
}

if (typeof module != "undefined") { // server hack.
	module.exports.createName=createName;
	module.exports.__internal=namesInternal;
}



var namesInternal={
	isValid:function(str) {

		// validation

		// Remove leading and trailing spaces because it is so much easier to work with later.
		str=str.replace(/^ */g,"").replace(/ *$/g,"");

		// 1) String must have at least 1 non-whitespace character
		if (str.length==0) { return false; }

		// 2) Must not be a reserved name
		var l=str.toLowerCase();
		for(var i=0;i<namesInternal.reservedNames.length;++i)
			if(namesInternal.reservedNames[i].regex.test(l))
				return false;

		// 3) Check for disallowed ASCII
		if ( /[\u0000-\u001F\u007F<>&\\,;]/.test(str) ) { return false; }

		// 4) Check for whitelisted unicode
		//    Easiest way I can think of is to replace the allowable unicode with the empty string and then check for anything higher than 0x7F
		//    Probably not the fastest method, sadly.

		for(var i=0;i<namesInternal.whitelistedUnicode.length;++i) {
			str=str.replace(new RegExp(namesInternal.whitelistedUnicode[i].unicode,"g"),"");
		}

		if( /[\u007F-\uFFFF]/.test(str) ) { return false; }

		return true;

	},
	canonicalForm:function(str) {
		for(var i=0;i<namesInternal.whitelistedUnicode.length;++i) {
			str=str.replace(new RegExp(namesInternal.whitelistedUnicode[i].unicode,"g"),namesInternal.whitelistedUnicode[i].ascii);
		}
		return str.toLowerCase();
	},
	htmlForm:function(str) {
		for(var i=0;i<namesInternal.whitelistedUnicode.length;++i) {
			str=str.replace(new RegExp(namesInternal.whitelistedUnicode[i].unicode,"g"),namesInternal.whitelistedUnicode[i].html);
		}
		return str;
	},
	whitelistedUnicode:[],
	whitelistUnicode:function(unicode,html,ascii) {
		this.whitelistedUnicode.push({unicode:unicode,html:html,ascii:ascii});
	},
	reservedNames:[],
	reserveName:function(reg,canWhisper) {
		this.reservedNames.push({regex:reg,whisper:canWhisper});
	}


};
// RESERVED NAMES:        RegExp                        , can whisper to
namesInternal.reserveName(/^unidentified player [0-9]+$/, false); // reserved for unidentified connections

// WHITELISTED UNICODE CHARACTERS
// There are numerous ways that using unicode characters can cause us problems.
//     Visually similar or even identical letter forms (full-width latin characters, combining diacriticals, etc)
//     Plain-old screwy characters (LTR/RTL overrides)
//     Zero-width characters
// To avoid numerous problems, we are deciding to WHITELIST only specific unicode characters, rather than attempt to blacklist troublesome ones.
// This whitelist is meant to be added to over time: the initial set of characters is simply enough to provide coverage for the games the developers play in.
// Note: In an attempt to keep this source-file ASCII-only, I am not including any of the literal characters in this file. I describe them by unicode code point and description.
//                             UNICODE    HTML ENTITY    ASCII EQUIV    DESCRIPTION
namesInternal.whitelistUnicode("\u00C0",  "&Agrave;",    "A");          // Upper-Case A with grave  (\) accent
namesInternal.whitelistUnicode("\u00E0",  "&agrave;",    "a");          // Lower-Case a with grave  (\) accent
namesInternal.whitelistUnicode("\u00C1",  "&Aacute;",    "A");          // Upper-Case A with accute (/) accent
namesInternal.whitelistUnicode("\u00E1",  "&aacute;",    "a");          // Lower-Case a with accute (/) accent
namesInternal.whitelistUnicode("\u00C2",  "&Acirc;",     "A");          // Upper-Case A with circumflex (^)
namesInternal.whitelistUnicode("\u00E2",  "&acirc;",     "a");          // Lower-Case a with circumflex (^)
namesInternal.whitelistUnicode("\u00C4",  "&Auml;",      "A");          // Upper-Case A with umlauts/dieresis (two dots)
namesInternal.whitelistUnicode("\u00E4",  "&auml;",      "a");          // Lower-Case a with umlauts/dieresis (two dots)

namesInternal.whitelistUnicode("\u00C8",  "&Egrave;",    "E");          // Upper-Case E with grave  (\) accent
namesInternal.whitelistUnicode("\u00E8",  "&egrave;",    "e");          // Lower-Case e with grave  (\) accent
namesInternal.whitelistUnicode("\u00C9",  "&Eacute;",    "E");          // Upper-Case E with accute (/) accent
namesInternal.whitelistUnicode("\u00E9",  "&eacute;",    "e");          // Lower-Case e with accute (/) accent
namesInternal.whitelistUnicode("\u00CA",  "&Ecirc;",     "E");          // Upper-Case E with circumflex (^)
namesInternal.whitelistUnicode("\u00EA",  "&ecirc;",     "e");          // Lower-Case e with circumflex (^)
namesInternal.whitelistUnicode("\u00CB",  "&Euml;",      "E");          // Upper-Case E with umlauts/dieresis (two dots)
namesInternal.whitelistUnicode("\u00EB",  "&euml;",      "e");          // Lower-Case e with umlauts/dieresis (two dots)

namesInternal.whitelistUnicode("\u00CC",  "&Igrave;",    "I");          // Upper-Case I with grave  (\) accent
namesInternal.whitelistUnicode("\u00EC",  "&igrave;",    "i");          // Lower-Case i with grave  (\) accent
namesInternal.whitelistUnicode("\u00CD",  "&Iacute;",    "I");          // Upper-Case I with accute (/) accent
namesInternal.whitelistUnicode("\u00ED",  "&iacute;",    "i");          // Lower-Case i with accute (/) accent
namesInternal.whitelistUnicode("\u00CE",  "&Icirc;",     "I");          // Upper-Case I with circumflex (^)
namesInternal.whitelistUnicode("\u00EE",  "&icirc;",     "i");          // Lower-Case i with circumflex (^)
namesInternal.whitelistUnicode("\u00CF",  "&Iuml;",      "I");          // Upper-Case I with umlauts/dieresis (two dots)
namesInternal.whitelistUnicode("\u00EF",  "&iuml;",      "i");          // Lower-Case i with umlauts/dieresis (two dots)

namesInternal.whitelistUnicode("\u00D2",  "&Ograve;",    "O");          // Upper-Case O with grave  (\) accent
namesInternal.whitelistUnicode("\u00F2",  "&ograve;",    "o");          // Lower-Case o with grave  (\) accent
namesInternal.whitelistUnicode("\u00D3",  "&Oacute;",    "O");          // Upper-Case O with accute (/) accent
namesInternal.whitelistUnicode("\u00F3",  "&oacute;",    "o");          // Lower-Case o with accute (/) accent
namesInternal.whitelistUnicode("\u00D4",  "&Ocirc;",     "O");          // Upper-Case O with circumflex (^)
namesInternal.whitelistUnicode("\u00F4",  "&ocirc;",     "o");          // Lower-Case o with circumflex (^)
namesInternal.whitelistUnicode("\u00D6",  "&Ouml;",      "O");          // Upper-Case O with umlauts/dieresis (two dots)
namesInternal.whitelistUnicode("\u00F6",  "&ouml;",      "o");          // Lower-Case o with umlauts/dieresis (two dots)

namesInternal.whitelistUnicode("\u00D9",  "&Ugrave;",    "U");          // Upper-Case U with grave  (\) accent
namesInternal.whitelistUnicode("\u00F9",  "&ugrave;",    "u");          // Lower-Case u with grave  (\) accent
namesInternal.whitelistUnicode("\u00DA",  "&Uacute;",    "U");          // Upper-Case U with accute (/) accent
namesInternal.whitelistUnicode("\u00FA",  "&uacute;",    "u");          // Lower-Case u with accute (/) accent
namesInternal.whitelistUnicode("\u00DB",  "&Ucirc;",     "U");          // Upper-Case U with circumflex (^)
namesInternal.whitelistUnicode("\u00FB",  "&ucirc;",     "u");          // Lower-Case u with circumflex (^)
namesInternal.whitelistUnicode("\u00DC",  "&Uuml;",      "U");          // Upper-Case U with umlauts/dieresis (two dots)
namesInternal.whitelistUnicode("\u00FC",  "&uuml;",      "u");          // Lower-Case u with umlauts/dieresis (two dots)

namesInternal.whitelistUnicode("\u00C7",  "&Ccedil;",    "C");          // Upper-Case C with cedilla (tail)
namesInternal.whitelistUnicode("\u00E7",  "&ccedil;",    "c");          // Lower-Case c with cedilla (tail)

namesInternal.whitelistUnicode("\u00D1",  "&Ntilde;",    "N");          // Upper-Case N with tilde (~)
namesInternal.whitelistUnicode("\u00F1",  "&ntilde;",    "n");          // Lower-Case n with tilde (~)

namesInternal.whitelistUnicode("\u00C6",  "&AElig;",     "AE");         // Upper-Case AE ligature
namesInternal.whitelistUnicode("\u00E6",  "&aelig;",     "ae");         // Lower-Case ae ligature

namesInternal.whitelistUnicode("\u00DF",  "&szlig;",     "ss");         // Lower-case unicode sharp-s/eszett

// Retain this code to generate a table to make sure the whitelist is sane
//var s1="";
//var s2="";
//var s3="";
//for(var i=0;i<namesInternal.whitelistedUnicode.length;++i) {
//	s1+="<td>"+namesInternal.whitelistedUnicode[i].unicode+"</td>";
//	s2+="<td>"+namesInternal.whitelistedUnicode[i].html+"</td>";
//	s3+="<td>"+namesInternal.whitelistedUnicode[i].ascii+"</td>";
//}
//document.body.innerHTML="<table><tr>"+s1+"</tr><tr>"+s2+"</tr><tr>"+s3+"</tr></table>"
