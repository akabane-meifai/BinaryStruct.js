class BinaryStruct{
	constructor(buffer = null){
		this.$context = {integer: true, signed: false, littleEndian: true};
		this.$queue = [];
		this.$size = {const: 0, variables: [], nest: {}};
		this.$struct = {};
		this.currentBuffer = {buffer: (buffer == null) ? new ArrayBuffer(0) : buffer, next: null, prev: null};
		this.currentView = {view: new DataView(this.currentBuffer.buffer), ptr: 0};
		this.bufferAccess = {first: this.currentBuffer, last: this.currentBuffer};
		this.ptr = 0;
	}
	$(ctx){
		if(typeof ctx == "string"){
			for(let ch of ctx){
				if(ch == "i"){
					this.$context.integer = true;
				}else if(ch == "f"){
					this.$context.integer = false;
				}else if(ch == "s"){
					this.$context.signed = true;
				}else if(ch == "u"){
					this.$context.signed = false;
				}else if(ch == "l"){
					this.$context.littleEndian = true;
				}else if(ch == "b"){
					this.$context.littleEndian = false;
				}
			}
		}else{
			if("integer" in ctx){
				this.$context.integer = !!ctx.integer;
			}
			if("signed" in ctx){
				this.$context.signed = !!ctx.signed;
			}
			if("littleEndian" in ctx){
				this.$context.littleEndian = !!ctx.littleEndian;
			}
		}
		return this;
	}
	$1(field, times = null){
		let method = 0;
		if(!this.$context.integer){
			method = null;
		}else if(this.$context.signed){
			method = 1;
		}
		this.$queue.push({f: field, m: method, a: [], q: 1, t: times});
		if(times == null){
			this.$size.const++;
		}else if(typeof times == "number"){
			this.$size.const += times;
		}else{
			this.$size.variables.push(times);
		}
		return this;
	}
	$2(field, times = null){
		let method = 2;
		if(!this.$context.integer){
			method = null;
		}else if(this.$context.signed){
			method = 3;
		}
		this.$queue.push({f: field, m: method, a: [this.$context.littleEndian], q: 2, t: times});
		if(times == null){
			this.$size.const += 2;
		}else if(typeof times == "number"){
			this.$size.const += times << 1;
		}else{
			this.$size.variables.push([2, times]);
		}
		return this;
	}
	$4(field, times = null){
		let method = 4;
		if(!this.$context.integer){
			method = 6;
		}else if(this.$context.signed){
			method = 5;
		}
		this.$queue.push({f: field, m: method, a: [this.$context.littleEndian], q: 4, t: times});
		if(times == null){
			this.$size.const += 4;
		}else if(typeof times == "number"){
			this.$size.const += times << 2;
		}else{
			this.$size.variables.push([4, times]);
		}
		return this;
	}
	$8(field, times = null){
		let method = null;
		if(!this.$context.integer){
			method = 7;
		}
		this.$queue.push({f: field, m: method, a: [this.$context.littleEndian], q: 8, t: times});
		if(times == null){
			this.$size.const += 8;
		}else if(typeof times == "number"){
			this.$size.const += times << 3;
		}else{
			this.$size.variables.push([8, times]);
		}
		return this;
	}
	$N(field, size, times = null){
		this.$queue.push({f: field, m: "buffer", a: [], q: size, t: times});
		if(typeof size == "number"){
			if(times == null){
				this.$size.const += size;
			}else if(typeof times == "number"){
				this.$size.const += size * times;
			}else{
				this.$size.variables.push([times, size]);
			}
		}else{
			if(times == null){
				this.$size.variables.push(size);
			}else{
				this.$size.variables.push([times, size]);
			}
		}
		return this;
	}
	$$(field, name, times = null){
		this.$queue.push({f: field, m: "nest", a: [], q: null, t: times});
		if(times == null){
			this.$size.nest[field] = name;
		}else{
			this.$size.nest[field] = [name, times];
		}
		return this;
	}
	as(name, context, handler){
		this.$struct[name] = {
			queue: this.$queue,
			size: this.$size,
			handler: handler,
			context: context
		};
		this.$queue = [];
		this.$size = {const: 0, variables: [], nest: {}};
		return this;
	}
	test(name, data = null){
		const returnValue = (data == null);
		const cur = this.currentView;
		const start = cur.view.byteOffset + cur.ptr;
		const subBuffer = cur.view.buffer.slice(start, cur.view.buffer.byteLength);
		const subObj = new BinaryStruct();
		if(returnValue){
			data = {};
		}
		subObj.currentBuffer = {buffer: this.currentBuffer.buffer, next: null, prev: null};
		subObj.currentView = {view: new DataView(subObj.currentBuffer.buffer, start), ptr: 0};
		subObj.bufferAccess = {first: subObj.currentBuffer, last: subObj.currentBuffer};
		subObj.$struct = this.$struct;
		subObj.read(name, data);
		return returnValue ? data : this;
	}
	read(name, data = null){
		const {queue, size, handler, context} = this.$struct[name];
		const cur = this.currentView;
		const ptr = cur.ptr;
		const returnValue = (data == null);
		const ctx = {
			name: name,
			abort: false,
			struct: this
		};
		let offset = 0;
		const fieldTask = (fieldProp, i) => {
			if(fieldProp.m == null){
				if(cur.ptr + fieldProp.q > cur.view.byteLength){
					ctx.abort = true;
					return;
				}
				offset += fieldProp.q;
				cur.ptr += fieldProp.q;
				ctx.ptr = this.ptr + offset;
				ctx.offset = offset;
				ctx.curPtr = cur.ptr;
				return;
			}
			if(typeof fieldProp.m == "number"){
				if(cur.ptr + fieldProp.q > cur.view.byteLength){
					ctx.abort = true;
					return;
				}
				const value = cur.view[BinaryStruct.vrm[fieldProp.m]](cur.ptr, ...fieldProp.a);
				offset += fieldProp.q;
				cur.ptr += fieldProp.q;
				ctx.ptr = this.ptr + offset;
				ctx.offset = offset;
				ctx.curPtr = cur.ptr;
				if(i == null){
					data[fieldProp.f] = value;
				}else{
					data[fieldProp.f][i] = value;
				}
				return;
			}
			if(fieldProp.m == "buffer"){
				const len = (typeof fieldProp.q == "number") ? fieldProp.q : data[fieldProp.q];
				if(cur.ptr + len > cur.view.byteLength){
					ctx.abort = true;
				}
				if(ctx.abort){
					return;
				}
				const start = cur.view.byteOffset + cur.ptr;
				const value = cur.view.buffer.slice(start, start + len);
				offset += len;
				cur.ptr += len;
				ctx.ptr = this.ptr + offset;
				ctx.offset = offset;
				ctx.curPtr = cur.ptr;
				if(i == null){
					data[fieldProp.f] = value;
				}else{
					data[fieldProp.f][i] = value;
				}
				return;
			}
			if(fieldProp.m == "nest"){
				const start = cur.view.byteOffset + cur.ptr;
				const subBuffer = cur.view.buffer.slice(start, cur.view.buffer.byteLength);
				const subObj = new BinaryStruct();
				subObj.currentBuffer = {buffer: this.currentBuffer.buffer, next: null, prev: null};
				subObj.currentView = {view: new DataView(subObj.currentBuffer.buffer, start), ptr: 0};
				subObj.bufferAccess = {first: subObj.currentBuffer, last: subObj.currentBuffer};
				subObj.$struct = this.$struct;
				subObj.read(Array.isArray(size.nest[fieldProp.f]) ? size.nest[fieldProp.f][0] : size.nest[fieldProp.f], (i == null) ? data[fieldProp.f] : data[fieldProp.f][i]);
				offset += subObj.ptr;
				cur.ptr += subObj.ptr;
				return;
			}
		};
		if(returnValue){
			data = {};
		}
		data[context] = ctx;
		ctx.index = null;
		ctx.ptr = this.ptr + offset;
		ctx.offset = offset;
		ctx.curPtr = cur.ptr;
		if(handler in data){
			data[handler]("startRead");
		}
		for(let fieldProp of queue){
			ctx.index = null;
			if(fieldProp.t == null){
				fieldTask(fieldProp, null);
				if(ctx.abort){
					break;
				}
			}else{
				const times = (typeof fieldProp.t == "number") ? fieldProp.t : data[fieldProp.t];
				if(ctx.abort){
					break;
				}
				for(let i = 0; i < times; i++){
					ctx.index = i;
					fieldTask(fieldProp, i);
					if(ctx.abort){
						break;
					}
				}
				if(ctx.abort){
					break;
				}
			}
		}
		if(ctx.abort){
			cur.ptr = ptr;
			if(handler in data){
				ctx.index = null;
				ctx.ptr = this.ptr;
				ctx.offset = 0;
				ctx.curPtr = cur.ptr;
				data[handler]("readFailed");
			}
			data = null;
		}else{
			this.ptr += offset;
			if(handler in data){
				ctx.index = null;
				ctx.ptr = this.ptr;
				ctx.offset = offset;
				ctx.curPtr = cur.ptr;
				data[handler]("readSucceeded");
			}
		}
		return returnValue ? data : this;
	}
	write(name, data = null){
		const {queue, size, handler, context} = this.$struct[name];
		const buffer = new ArrayBuffer(this.sizeof(name, data));
		const cur = {view: new DataView(buffer), ptr: 0};
		const ptr = cur.ptr;
		const ctx = {
			name: name,
			abort: false,
			struct: this
		};
		let offset = 0;
		const fieldTask = (fieldProp, i) => {
			if(fieldProp.m == null){
				offset += fieldProp.q;
				cur.ptr += fieldProp.q;
				ctx.ptr = this.ptr + offset;
				ctx.offset = offset;
				ctx.curPtr = cur.ptr;
				return;
			}
			const value = (i == null) ? data[fieldProp.f] : data[fieldProp.f][i];
			if(ctx.abort){
				return;
			}
			if(typeof fieldProp.m == "number"){
				cur.view[BinaryStruct.vwm[fieldProp.m]](cur.ptr, value, ...fieldProp.a);
				offset += fieldProp.q;
				cur.ptr += fieldProp.q;
				ctx.ptr = this.ptr + offset;
				ctx.offset = offset;
				ctx.curPtr = cur.ptr;
				return;
			}
			if(fieldProp.m == "buffer"){
				const len = (typeof fieldProp.q == "number") ? fieldProp.q : data[fieldProp.q];
				if(ctx.abort){
					return;
				}
				const start = cur.view.byteOffset + cur.ptr;
				const byteArray = new Uint8Array(cur.view.buffer, start, len);
				byteArray.set(new Uint8Array(value, 0, len), 0);
				offset += len;
				cur.ptr += len;
				ctx.ptr = this.ptr + offset;
				ctx.offset = offset;
				ctx.curPtr = cur.ptr;
				return;
			}
			if(fieldProp.m == "nest"){
				const subObj = new BinaryStruct();
				subObj.$struct = this.$struct;
				subObj.write(Array.isArray(size.nest[fieldProp.f]) ? size.nest[fieldProp.f][0] : size.nest[fieldProp.f], value);
				const subArray = new Uint8Array(subObj.currentBuffer.buffer);
				const start = cur.view.byteOffset + cur.ptr;
				const byteArray = new Uint8Array(cur.view.buffer, start, subArray.byteLength);
				byteArray.set(subArray, 0);
				offset += subArray.byteLength;
				cur.ptr += subArray.byteLength;
				ctx.ptr = this.ptr + offset;
				ctx.offset = offset;
				ctx.curPtr = cur.ptr;
				return;
			}
		};
		data[context] = ctx;
		ctx.index = null;
		ctx.ptr = this.ptr + offset;
		ctx.offset = offset;
		ctx.curPtr = cur.ptr;
		if(handler in data){
			data[handler]("startWrite");
		}
		for(let fieldProp of queue){
			ctx.index = null;
			if(fieldProp.t == null){
				fieldTask(fieldProp, null);
			}else{
				const times = (typeof fieldProp.t == "number") ? fieldProp.t : data[fieldProp.t];
				if(ctx.abort){
					break;
				}
				for(let i = 0; i < times; i++){
					ctx.index = i;
					fieldTask(fieldProp, i);
					if(ctx.abort){
						break;
					}
				}
				if(ctx.abort){
					break;
				}
			}
		}
		if(ctx.abort){
			cur.ptr = ptr;
			if(handler in data){
				ctx.index = null;
				ctx.ptr = this.ptr;
				ctx.offset = 0;
				ctx.curPtr = cur.ptr;
				data[handler]("writeFailed");
			}
		}else{
			this.ptr += offset;
			if(this.currentBuffer.buffer.byteLength == 0){
				this.currentBuffer.buffer = buffer;
				this.currentView = cur;
			}else{
				const insertBuffer = {buffer: buffer, next: null, prev: null};
				if(this.currentView.pos <= 0){
					insertBuffer.prev = this.currentBuffer.prev;
					insertBuffer.next = this.currentBuffer;
					this.currentBuffer.prev = insertBuffer;
					this.currentBuffer = insertBuffer;
					this.currentView = cur;
					if(insertBuffer.prev == null){
						this.bufferAccess.first = insertBuffer;
					}else{
						insertBuffer.prev.next = insertBuffer;
					}
				}else if(this.currentView.pos >= this.currentView.byteLength){
					insertBuffer.prev = this.currentBuffer;
					insertBuffer.next = this.currentBuffer.next;
					this.currentBuffer.next = insertBuffer;
					this.currentBuffer = insertBuffer;
					this.currentView = cur;
					if(insertBuffer.next == null){
						this.bufferAccess.last = insertBuffer;
					}else{
						insertBuffer.next.prev = insertBuffer;
					}
				}else{
					const prevBuffer = {buffer: this.currentView.buffer.slice(0, this.currentView.pos), next: insertBuffer, prev: this.currentBuffer.prev};
					const nextBuffer = {buffer: this.currentView.buffer.slice(this.currentView.pos, this.currentView.byteLength), next: this.currentBuffer.next, prev: insertBuffer};
					insertBuffer.prev = prevBuffer;
					insertBuffer.next = nextBuffer;
					this.currentBuffer = insertBuffer;
					this.currentView = cur;
					if(prevBuffer.prev == null){
						this.bufferAccess.first = prevBuffer;
					}else{
						prevBuffer.prev.next = prevBuffer;
					}
					if(nextBuffer.next == null){
						this.bufferAccess.last = nextBuffer;
					}else{
						nextBuffer.next.prev = nextBuffer;
					}
				}
			}
			if(handler in data){
				ctx.index = null;
				ctx.ptr = this.ptr;
				ctx.offset = offset;
				ctx.curPtr = cur.ptr;
				data[handler]("writeSucceeded");
			}
		}
		return this;
	}
	sizeof(name, data = null){
		const {queue, size, context, handler} = this.$struct[name];
		const ctx = {
			name: name,
			abort: false,
			struct: this,
			ptr: this.ptr,
			curPtr: 0,
			offset: 0
		};
		let len = size.const;
		for(let variable of size.variables){
			ctx.index = null;
			if(Array.isArray(variable)){
				let n = (typeof variable[0] == "number") ? variable[0] : data[variable[0]];
				let m = variable.length;
				for(let i = 0; i < n; i++){
					let len2 = 1;
					ctx.index = i;
					for(let j = 1; j < m; j++){
						len2 *= (typeof variable[j] == "number") ? variable[j] : data[variable[j]];
					}
					len += len2;
				}
			}else{
				len += data[variable];
			}
		}
		for(let field in size.nest){
			ctx.index = null;
			if(Array.isArray(size.nest[field])){
				let n = (typeof size.nest[field][1] == "number") ? size.nest[field][1] : data[size.nest[field][1]];
				for(let i = 0; i < n; i++){
					ctx.index = i;
					const nestData = data[field][i];
					len += this.sizeof(size.nest[field][0], nestData);
				}
			}else{
				const nestData = data[field];
				len += this.sizeof(size.nest[field], nestData);
			}
		}
		return len;
	}
	seek(offset, whence = "cur"){
		if(whence == "set"){
			let pos = 0;
			for(this.currentBuffer = this.bufferAccess.first; pos + this.currentBuffer.buffer.byteLength < offset; this.currentBuffer = this.currentBuffer.next){
				pos += this.currentBuffer.buffer.byteLength;
			}
			this.currentView = {view: new DataView(this.currentBuffer.buffer), ptr: offset - pos};
			this.ptr = offset;
		}else if(whence == "end"){
			this.currentBuffer = this.bufferAccess.last;
			let offset2 = this.currentBuffer.buffer.byteLength + offset;
			while(offset2 < 0){
				this.currentBuffer = this.currentBuffer.prev;
				offset2 += this.currentBuffer.buffer.byteLength;
			}
			this.currentView = {view: new DataView(this.currentBuffer.buffer), ptr: offset2};
			this.ptr = offset2;
			for(let buffer = this.currentBuffer.prev; buffer != null; buffer = buffer.prev){
				this.ptr += buffer.buffer.byteLength;
			}
		}else{
			let offset2 = offset + this.currentView.ptr;
			while(offset2 > this.currentBuffer.buffer.byteLength){
				offset2 -= this.currentBuffer.buffer.byteLength;
				this.currentBuffer = this.currentBuffer.next;
			}
			while(offset2 < 0){
				this.currentBuffer = this.currentBuffer.prev;
				offset2 += this.currentBuffer.buffer.byteLength;
			}
			this.currentView = {view: new DataView(this.currentBuffer.buffer), ptr: offset2};
			this.ptr += offset;
		}
		return this;
	}
	static vrm = ["getUint8", "getInt8", "getUint16", "getInt16", "getUint32", "getInt32", "getFloat32", "getFloat64"];
	static vwm = ["setUint8", "setInt8", "setUint16", "setInt16", "setUint32", "setInt32", "setFloat32", "setFloat64"];
}
