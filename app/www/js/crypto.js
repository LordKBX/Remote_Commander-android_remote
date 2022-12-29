Crytography =
{
	charDictionary: JSON.parse(
		'{\
		"0": 0, "1": 1, "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9, "A": 10, "B": 11, "C": 12, \
		"D": 13, "E": 14, "F": 15, "G": 16, "H": 17, "I": 18, "J": 19, "K": 20, "L": 21, "M": 22, "N": 23, "O": 24, \
		"P": 25, "Q": 26, "R": 27, "S": 28, "T": 29, "U": 30, "V": 31, "W": 32, "X": 33, "Y": 34, "Z": 35, "a": 36, \
		"b": 37, "c": 38, "d": 39, "e": 40, "f": 41, "g": 42, "h": 43, "i": 44, "j": 45, "k": 46, "l": 47, "m": 48, \
		"n": 49, "o": 50, "p": 51, "q": 52, "r": 53, "s": 54, "t": 55, "u": 56, "v": 57, "w": 58, "x": 59, "y": 60, \
		"z": 61, "=": 62, "+": 63, "/": 64 \
		}'),
	PublicKey: null,
	PrivateKey: null,

	Init: function (keyLength = 1024) //Must be 512, 1024, 2048, ‭4096‬
	{
		if (keyLength == 512 || keyLength == 1024 || keyLength == 2048 || keyLength == 4096)
		{
			div1 = keyLength / 8;
			div2 = div1 / 8;
			this.PublicKey = this.RandomString(keyLength / 8);
			this.PrivateKey = this.GetPrivateKey(this.PublicKey);
			return true;
		}
		return false;
	},

	RandomString: function (length)
	{
		var result = '';
		var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
		var charactersLength = characters.length;
		for (var i = 0; i < length; i++) { result += characters.charAt(Math.floor(Math.random() * charactersLength)); }
		return result;
	},

	Split: function (str, chunkSize)
	{
		tab = [];
		for (i = 0; i < str.length / chunkSize; i++) { re = str.substring(i * chunkSize, (i + 1) * chunkSize); tab.push(re); }
		return tab;
	},

	numKeys: function (obj)
	{
		var count = 0;
		for (var prop in obj) { count++; }
		return count;
	},

	GetPrivateKey: function (MyPublicKey)
	{
		div1 = MyPublicKey.length;
		div2 = div1 / 8;
		tab = this.Split(MyPublicKey, div2);
		intitules = "ABCDEFGH";
		partno = 0;
		pk = {};
		for (index in tab)
		{
			segment = tab[index];
			pk[intitules[partno]] = segment;
			partno += 1;
		}
		return pk;
	},

	GetPublicKeyString: function () { return this.PublicKey; },

	Encrypt: function (toEncrypt, key, end)
	{
		if (key === undefined) { key = null; }
		if (end === undefined) { end = ""; } 
		if (end === null) { end = ""; } 
		if (toEncrypt == null) { return null; } 
		if (toEncrypt.length == 0) { return null; }
		pk = null;
		if (key == null) { pk = this.PrivateKey; }
		else
		{
			if (key.length == 0) { return null; }
			pk = this.GetPrivateKey(key);
		}
		ret = this.GetEndKey(pk, end);
		end = ret["end"];
		endpk = ret["endpk"];
		//console.log("pk", pk);
		//console.log("endpk", endpk
		b64 = Base64.encode(toEncrypt);
		keymax = this.numKeys(this.charDictionary) - 1;
		nrt = "";
		ikey = 0;
		mkey = endpk.length - 1;
		reb = 0;
		//if (b64[b64.length - 1] == '=') { reb = 1; }
		for (i = 0; i < b64.length - reb; i++)
		{
			val = b64[i];
			//console.log("char["+i+"] = " + val);
			num = this.charDictionary[val] + this.charDictionary[endpk[ikey]];
			if (num > keymax) { num -= keymax; }
			for (index in this.charDictionary)
			{
				if (this.charDictionary[index] == num) { nrt += index; }
			}
			ikey++;
			if (ikey >= mkey) { ikey = 0; }
		}
		return nrt + end;
	},

	Decrypt: function (cipherString, key)
	{
		if (key === undefined) { key = null; }
		if (cipherString == null) { return null; }
		if (cipherString.length == 0) { return null; }
		end = cipherString.substring(cipherString.length - 8);
		cipherString = cipherString.substring(0, cipherString.length - 8);
		pk = null;
		if (key == null) { pk = this.PrivateKey; }
		else
		{
			if (key.length == 0) { return null; }
			pk = this.GetPrivateKey(key);
		}
		endpk = this.GetEndKey(pk, end)["endpk"];

		keymax = this.numKeys(this.charDictionary) - 1;

		nrt = "";
		ikey = 0;
		mkey = endpk.length - 1;
		for (i = 0; i < cipherString.length; i++)
		{
			val = cipherString[i];
			num = this.charDictionary[val] - this.charDictionary[endpk[ikey]];
			if (num < 0) { num += keymax; }
			for (index in this.charDictionary)
			{
				if (this.charDictionary[index] == num) { nrt += index; }
			}
			ikey++;
			if (ikey >= mkey) { ikey = 0; }
		}
		try { return Base64.decode(nrt); }
		catch (err)
		{
			try { return Base64.decode(nrt + "="); }
			catch (err) { return null; }
		}
	},

	GetEndKey: function (pk, end)
	{
		if (end === undefined) { end = ""; }
		ret = {};
		chars = "ABCDEFGH";
		y = 0;
		while (end.length != chars.length)
		{
			y = Math.floor(Math.random() * chars.length);
			if (end.search(chars[y]) == -1) { end += chars[y]; }
		}
		endpk = "";
		for (index in end) { endpk += pk[end[index]]; }
		ret["end"] = end;
		ret["endpk"] = endpk;
		return ret;
	}
};
