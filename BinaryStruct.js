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
	as(name, handler, ...args){
		if(!("get" in handler)){
			handler.get = prop => Array.isArray(prop.data[prop.prop]) ? prop.data[prop.prop][prop.index] : prop.data[prop.prop];
		}
		if(!("set" in handler)){
			handler.set = prop => (prop.index == null) ? prop.data[prop.prop] : prop.data[prop.prop][prop.index];
		}
		this.$struct[name] = {
			queue: this.$queue,
			size: this.$size,
			handler: handler,
			args: args
		};
		this.$queue = [];
		this.$size = {const: 0, variables: [], nest: {}};
		return this;
	}
	read(name, returnValue = false){
		const {queue, size, handler, args} = this.$struct[name];
		const cur = this.currentView;
		const data = {};
		const ptr = cur.ptr;
		let offset = 0;
		let callProp = {abort: false};
		const genProp = (prop, index) => {
			return {
				prop: prop,
				data: data,
				index: index,
				ptr: this.ptr + offset,
				curPtr: cur.ptr,
				offset: offset,
				abort: false,
				struct: this
			};
		};
		const fieldTask = (fieldProp, i) => {
			if(fieldProp.m == null){
				if(cur.ptr + fieldProp.q > cur.view.byteLength){
					callProp.abort = true;
					return;
				}
				offset += fieldProp.q;
				cur.ptr += fieldProp.q;
				return;
			}
			if(typeof fieldProp.m == "number"){
				if(cur.ptr + fieldProp.q > cur.view.byteLength){
					callProp.abort = true;
					return;
				}
				const value = cur.view[BinaryStruct.vrm[fieldProp.m]](cur.ptr, ...fieldProp.a);
				offset += fieldProp.q;
				cur.ptr += fieldProp.q;
				if(i == null){
					data[fieldProp.f] = value;
					data[fieldProp.f] = handler.set(callProp = genProp(fieldProp.f, i), ...args);
				}else{
					data[fieldProp.f].push(value);
					data[fieldProp.f][i] = handler.set(callProp = genProp(fieldProp.f, i), ...args);
				}
				return;
			}
			if(fieldProp.m == "buffer"){
				const len = (typeof fieldProp.q == "number") ? fieldProp.q : handler.get(callProp = genProp(fieldProp.q, i), ...args);
				if(cur.ptr + len > cur.view.byteLength){
					callProp.abort = true;
				}
				if(callProp.abort){
					return;
				}
				const start = cur.view.byteOffset + cur.ptr;
				const value = cur.view.buffer.slice(start, start + len);
				offset += len;
				cur.ptr += len;
				if(i == null){
					data[fieldProp.f] = value;
					data[fieldProp.f] = handler.set(callProp = genProp(fieldProp.f, i), ...args);
				}else{
					data[fieldProp.f].push(value);
					data[fieldProp.f][i] = handler.set(callProp = genProp(fieldProp.f, i), ...args);
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
				const value = subObj.read(Array.isArray(size.nest[fieldProp.f]) ? size.nest[fieldProp.f][0] : size.nest[fieldProp.f], true);
				if(value == null){
					callProp.abort = true;
					return;
				}
				offset += subObj.ptr;
				cur.ptr += subObj.ptr;
				if(i == null){
					data[fieldProp.f] = value;
					data[fieldProp.f] = handler.set(callProp = genProp(fieldProp.f, i), ...args);
				}else{
					data[fieldProp.f].push(value);
					data[fieldProp.f][i] = handler.set(callProp = genProp(fieldProp.f, i), ...args);
				}
				return;
			}
		};
		if("startRead" in handler){
			handler.startRead({
				prop: null,
				data: data,
				index: null,
				ptr: this.ptr,
				curPtr: cur.ptr,
				offset: 0,
				abort: false,
				struct: this
			}, ...args);
		}
		for(let fieldProp of queue){
			if(fieldProp.t == null){
				fieldTask(fieldProp, null);
				if(callProp.abort){
					break;
				}
			}else{
				const times = (typeof fieldProp.t == "number") ? fieldProp.t : handler.get(callProp = genProp(fieldProp.t, null), ...args);
				if(callProp.abort){
					break;
				}
				data[fieldProp.f] = [];
				for(let i = 0; i < times; i++){
					fieldTask(fieldProp, i);
					if(callProp.abort){
						break;
					}
				}
				if(callProp.abort){
					break;
				}
			}
		}
		let val = data;
		if(callProp.abort){
			cur.ptr = ptr;
			if("readFailed" in handler){
				val = handler.readFailed({
					prop: null,
					data: null,
					index: null,
					ptr: this.ptr,
					curPtr: cur.ptr,
					offset: 0,
					abort: true,
					struct: this
				}, ...args);
			}else{
				val = null;
			}
		}else{
			this.ptr += offset;
			if("readSucceeded" in handler){
				val = handler.readSucceeded({
					prop: null,
					data: data,
					index: null,
					ptr: this.ptr,
					curPtr: cur.ptr,
					offset: offset,
					abort: true,
					struct: this
				}, ...args);
			}
		}
		return returnValue ? val : this;
	}
	write(name, data = null){
		const {queue, size, handler, args} = this.$struct[name];
		const buffer = new ArrayBuffer(this.sizeof(name, data));
		const cur = {view: new DataView(buffer), ptr: 0};
		const ptr = cur.ptr;
		let offset = 0;
		let callProp = {abort: false};
		const genProp = (prop, index) => {
			return {
				prop: prop,
				data: data,
				index: index,
				ptr: this.ptr + offset,
				curPtr: cur.ptr,
				offset: offset,
				abort: false,
				struct: this
			};
		};
		const fieldTask = (fieldProp, i) => {
			if(fieldProp.m == null){
				offset += fieldProp.q;
				cur.ptr += fieldProp.q;
				return;
			}
			const value = handler.get(callProp = genProp(fieldProp.f, i), ...args);
			if(callProp.abort){
				return;
			}
			if(typeof fieldProp.m == "number"){
				cur.view[BinaryStruct.vwm[fieldProp.m]](cur.ptr, value, ...fieldProp.a);
				offset += fieldProp.q;
				cur.ptr += fieldProp.q;
				return;
			}
			if(fieldProp.m == "buffer"){
				const len = (typeof fieldProp.q == "number") ? fieldProp.q : handler.get(callProp = genProp(fieldProp.q, i), ...args);
				if(callProp.abort){
					return;
				}
				const start = cur.view.byteOffset + cur.ptr;
				const byteArray = new Uint8Array(cur.view.buffer, start, len);
				byteArray.set(new Uint8Array(value, 0, len), 0);
				offset += len;
				cur.ptr += len;
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
				return;
			}
		};
		if("startWrite" in handler){
			handler.startWrite({
				prop: null,
				data: data,
				index: null,
				ptr: this.ptr,
				curPtr: cur.ptr,
				offset: 0,
				abort: false,
				struct: this
			}, ...args);
		}
		for(let fieldProp of queue){
			if(fieldProp.t == null){
				fieldTask(fieldProp, null);
			}else{
				const times = (typeof fieldProp.t == "number") ? fieldProp.t : handler.get(callProp = genProp(fieldProp.t, null), ...args);
				if(callProp.abort){
					break;
				}
				for(let i = 0; i < times; i++){
					fieldTask(fieldProp, i);
					if(callProp.abort){
						break;
					}
				}
				if(callProp.abort){
					break;
				}
			}
		}
		if(callProp.abort){
			cur.ptr = ptr;
			if("writeFailed" in handler){
				handler.writeFailed({
					prop: null,
					data: data,
					index: null,
					ptr: this.ptr,
					curPtr: cur.ptr,
					offset: 0,
					abort: true,
					struct: this
				}, ...args);
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
			if("writeSucceeded" in handler){
				handler.writeSucceeded({
					prop: null,
					data: data,
					index: null,
					ptr: this.ptr,
					curPtr: cur.ptr,
					offset: offset,
					abort: false,
					struct: this
				}, ...args);
			}
		}
		return this;
	}
	sizeof(name, data = null){
		const {queue, size, handler, args} = this.$struct[name];
		let len = size.const;
		for(let variable of size.variables){
			if(Array.isArray(variable)){
				let n = (typeof variable[0] == "number") ? variable[0] : handler.get({
					prop: variable[0],
					data: data,
					index: index,
					ptr: this.ptr,
					curPtr: 0,
					offset: 0,
					abort: false,
					struct: this
				}, ...args);
				let m = variable.length;
				for(let i = 0; i < n; i++){
					let len2 = 1;
					for(let j = 1; j < m; j++){
						len2 *= (typeof variable[j] == "number") ? variable[j] : handler.get({
							prop: variable[j],
							data: data,
							index: i,
							ptr: this.ptr,
							curPtr: 0,
							offset: 0,
							abort: false,
							struct: this
						}, ...args);
					}
					len += len2;
				}
			}else{
				len += handler.get({
					prop: variable,
					data: data,
					index: null,
					ptr: this.ptr,
					curPtr: 0,
					offset: 0,
					abort: false,
					struct: this
				}, ...args);
			}
		}
		for(let field in size.nest){
			if(Array.isArray(size.nest[field])){
				let n = (typeof size.nest[field][1] == "number") ? size.nest[field][1] : handler.get({
					prop: size.nest[field][1],
					data: data,
					index: null,
					ptr: this.ptr,
					curPtr: 0,
					offset: 0,
					abort: false,
					struct: this
				}, ...args);
				for(let i = 0; i < n; i++){
					const nestData = handler.get({
						prop: field,
						data: data,
						index: i,
						ptr: this.ptr,
						curPtr: 0,
						offset: 0,
						abort: false,
						struct: this
					}, ...args);
					len += this.sizeof(size.nest[field][0], nestData);
				}
			}else{
				const nestData = handler.get({
					prop: field,
					data: data,
					index: null,
					ptr: this.ptr,
					curPtr: 0,
					offset: 0,
					abort: false,
					struct: this
				}, ...args);
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
