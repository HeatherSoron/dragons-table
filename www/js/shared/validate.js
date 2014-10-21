function validateAPIObject(ex,msg) {
    if (typeof(ex) == "object") {
		if(typeof msg != "object") { return false; }
		if (Array.isArray(ex)) {
			// We want an array. Make sure that msg is an array too!
			if (!Array.isArray(msg)) { return false; }
			// Ok, so msg is an array. Do we have any bounds on size?
			var min=0;
			var max=Infinity
			if (ex[1]) { min=ex[1]; }
			if (ex[2]) { max=ex[2]; }
			if (msg.length<min || msg.length>max) { return false; }

			// Our length is sane. What about types?
			for(var i=0;i<msg.length;++i) {
				if (!validateAPIObject(ex[0],msg[i])) { return false; } // always compare against ex[0].
			}
			return true;
		} else if (ex===null) {
			// I cannot envision ever WANTING an explicit null, but I want to handle it!
			return msg===null;
		} else {
			// We are some other kind of object
			var exKeys=[];
			var msgKeys=[];
			for(var i in ex)  { exKeys.push(i); }
			for(var i in msg) { msgKeys.push(i); }

			// Do we have the same number of keys? More or less is bad.
			// TODO: SUPPORT OPTIONAL VALUES HERE
			if (exKeys.length!=msgKeys.length) { return false; };

			exKeys.sort();
			msgKeys.sort();

			// Do all our keys match?
			// TODO: SUPPORT OPTIONAL VALUES HERE
			for(var i=0;i<exKeys.length;++i) {
				if(exKeys[i]!=msgKeys[i]) { return false; }
			}

			// Ok, we have exactly the expected keys, no more, no less. Lets validate.
			for(var i in ex) {
				if(!validateAPIObject(ex[i],msg[i])) { return false; }
			}
			return true;
		}
	} else {
		// we are NOT an object, but rather a primitive such as a number, string, boolean
		return typeof(ex) == typeof (msg);
	}
}

if (typeof module != "undefined") { // server hack.
	module.exports.validateAPIObject=validateAPIObject;
}

