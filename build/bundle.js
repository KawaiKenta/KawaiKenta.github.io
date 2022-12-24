
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        if (value === null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
        else if (callback) {
            callback();
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
                // if the component was destroyed immediately
                // it will update the `$$.on_destroy` reference to `null`.
                // the destructured on_destroy may still reference to the old array
                if (component.$$.on_destroy) {
                    component.$$.on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: [],
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            if (!is_function(callback)) {
                return noop;
            }
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.55.0' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/components/skills/Embedded.svelte generated by Svelte v3.55.0 */

    const file$b = "src/components/skills/Embedded.svelte";

    function create_fragment$b(ctx) {
    	let div1;
    	let h3;
    	let t1;
    	let div0;
    	let ul;
    	let li0;
    	let t3;
    	let li1;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			h3 = element("h3");
    			h3.textContent = "EMBEDDED";
    			t1 = space();
    			div0 = element("div");
    			ul = element("ul");
    			li0 = element("li");
    			li0.textContent = "Arduino";
    			t3 = space();
    			li1 = element("li");
    			li1.textContent = "Rust";
    			attr_dev(h3, "class", "svelte-ykeqvk");
    			add_location(h3, file$b, 1, 2, 26);
    			attr_dev(li0, "class", "svelte-ykeqvk");
    			add_location(li0, file$b, 4, 6, 67);
    			attr_dev(li1, "class", "svelte-ykeqvk");
    			add_location(li1, file$b, 5, 6, 90);
    			attr_dev(ul, "class", "svelte-ykeqvk");
    			add_location(ul, file$b, 3, 4, 56);
    			add_location(div0, file$b, 2, 2, 46);
    			attr_dev(div1, "class", "container svelte-ykeqvk");
    			add_location(div1, file$b, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, h3);
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			append_dev(div0, ul);
    			append_dev(ul, li0);
    			append_dev(ul, t3);
    			append_dev(ul, li1);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Embedded', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Embedded> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Embedded extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Embedded",
    			options,
    			id: create_fragment$b.name
    		});
    	}
    }

    /* src/components/skills/Language.svelte generated by Svelte v3.55.0 */

    const file$a = "src/components/skills/Language.svelte";

    function create_fragment$a(ctx) {
    	let div;
    	let h3;
    	let t1;
    	let ul;
    	let li0;
    	let img0;
    	let img0_src_value;
    	let t2;
    	let li1;
    	let img1;
    	let img1_src_value;
    	let t3;
    	let li2;
    	let img2;
    	let img2_src_value;
    	let t4;
    	let li3;
    	let img3;
    	let img3_src_value;
    	let t5;
    	let li4;
    	let img4;
    	let img4_src_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			h3 = element("h3");
    			h3.textContent = "LANGUAGE";
    			t1 = space();
    			ul = element("ul");
    			li0 = element("li");
    			img0 = element("img");
    			t2 = space();
    			li1 = element("li");
    			img1 = element("img");
    			t3 = space();
    			li2 = element("li");
    			img2 = element("img");
    			t4 = space();
    			li3 = element("li");
    			img3 = element("img");
    			t5 = space();
    			li4 = element("li");
    			img4 = element("img");
    			attr_dev(h3, "class", "svelte-1dmhqow");
    			add_location(h3, file$a, 9, 2, 278);
    			if (!src_url_equal(img0.src, img0_src_value = goImg)) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "Go");
    			attr_dev(img0, "class", "svelte-1dmhqow");
    			add_location(img0, file$a, 11, 8, 311);
    			attr_dev(li0, "class", "svelte-1dmhqow");
    			add_location(li0, file$a, 11, 4, 307);
    			if (!src_url_equal(img1.src, img1_src_value = rustImg)) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "Rust");
    			attr_dev(img1, "class", "svelte-1dmhqow");
    			add_location(img1, file$a, 12, 8, 353);
    			attr_dev(li1, "class", "svelte-1dmhqow");
    			add_location(li1, file$a, 12, 4, 349);
    			if (!src_url_equal(img2.src, img2_src_value = pythonImg)) attr_dev(img2, "src", img2_src_value);
    			attr_dev(img2, "alt", "Python");
    			attr_dev(img2, "class", "svelte-1dmhqow");
    			add_location(img2, file$a, 13, 8, 399);
    			attr_dev(li2, "class", "svelte-1dmhqow");
    			add_location(li2, file$a, 13, 4, 395);
    			if (!src_url_equal(img3.src, img3_src_value = dartImg)) attr_dev(img3, "src", img3_src_value);
    			attr_dev(img3, "alt", "Dart");
    			attr_dev(img3, "class", "svelte-1dmhqow");
    			add_location(img3, file$a, 14, 8, 449);
    			attr_dev(li3, "class", "svelte-1dmhqow");
    			add_location(li3, file$a, 14, 4, 445);
    			if (!src_url_equal(img4.src, img4_src_value = javaScriptImg)) attr_dev(img4, "src", img4_src_value);
    			attr_dev(img4, "alt", "JavaScript");
    			attr_dev(img4, "class", "svelte-1dmhqow");
    			add_location(img4, file$a, 15, 8, 495);
    			attr_dev(li4, "class", "svelte-1dmhqow");
    			add_location(li4, file$a, 15, 4, 491);
    			attr_dev(ul, "class", "svelte-1dmhqow");
    			add_location(ul, file$a, 10, 2, 298);
    			attr_dev(div, "class", "container svelte-1dmhqow");
    			add_location(div, file$a, 8, 0, 252);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h3);
    			append_dev(div, t1);
    			append_dev(div, ul);
    			append_dev(ul, li0);
    			append_dev(li0, img0);
    			append_dev(ul, t2);
    			append_dev(ul, li1);
    			append_dev(li1, img1);
    			append_dev(ul, t3);
    			append_dev(ul, li2);
    			append_dev(li2, img2);
    			append_dev(ul, t4);
    			append_dev(ul, li3);
    			append_dev(li3, img3);
    			append_dev(ul, t5);
    			append_dev(ul, li4);
    			append_dev(li4, img4);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const goImg = "./images/go-logo.png";
    const rustImg = "./images/rust-logo.png";
    const pythonImg = "./images/python-logo.png";
    const dartImg = "./images/dart-logo.png";
    const javaScriptImg = "./images/javascript-logo.png";

    function instance$a($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Language', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Language> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		goImg,
    		rustImg,
    		pythonImg,
    		dartImg,
    		javaScriptImg
    	});

    	return [];
    }

    class Language extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Language",
    			options,
    			id: create_fragment$a.name
    		});
    	}
    }

    /* src/components/skills/Progress.svelte generated by Svelte v3.55.0 */

    const file$9 = "src/components/skills/Progress.svelte";

    function create_fragment$9(ctx) {
    	let div3;
    	let div2;
    	let h5;
    	let t0;
    	let t1;
    	let span;
    	let t2;
    	let t3;
    	let t4;
    	let div1;
    	let div0;

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div2 = element("div");
    			h5 = element("h5");
    			t0 = text(/*name*/ ctx[0]);
    			t1 = space();
    			span = element("span");
    			t2 = text(/*percentage*/ ctx[1]);
    			t3 = text("%");
    			t4 = space();
    			div1 = element("div");
    			div0 = element("div");
    			attr_dev(h5, "class", "svelte-14lvn0y");
    			add_location(h5, file$9, 7, 4, 112);
    			attr_dev(span, "class", "percentage svelte-14lvn0y");
    			add_location(span, file$9, 8, 4, 132);
    			attr_dev(div0, "class", "progressbar svelte-14lvn0y");
    			set_style(div0, "width", /*percentage*/ ctx[1] + "%");
    			add_location(div0, file$9, 10, 6, 208);
    			attr_dev(div1, "class", "cover svelte-14lvn0y");
    			add_location(div1, file$9, 9, 4, 182);
    			attr_dev(div2, "class", "html");
    			add_location(div2, file$9, 6, 2, 89);
    			attr_dev(div3, "class", "skillbox svelte-14lvn0y");
    			add_location(div3, file$9, 5, 0, 64);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div2);
    			append_dev(div2, h5);
    			append_dev(h5, t0);
    			append_dev(div2, t1);
    			append_dev(div2, span);
    			append_dev(span, t2);
    			append_dev(span, t3);
    			append_dev(div2, t4);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*name*/ 1) set_data_dev(t0, /*name*/ ctx[0]);
    			if (dirty & /*percentage*/ 2) set_data_dev(t2, /*percentage*/ ctx[1]);

    			if (dirty & /*percentage*/ 2) {
    				set_style(div0, "width", /*percentage*/ ctx[1] + "%");
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Progress', slots, []);
    	let { name } = $$props;
    	let { percentage } = $$props;

    	$$self.$$.on_mount.push(function () {
    		if (name === undefined && !('name' in $$props || $$self.$$.bound[$$self.$$.props['name']])) {
    			console.warn("<Progress> was created without expected prop 'name'");
    		}

    		if (percentage === undefined && !('percentage' in $$props || $$self.$$.bound[$$self.$$.props['percentage']])) {
    			console.warn("<Progress> was created without expected prop 'percentage'");
    		}
    	});

    	const writable_props = ['name', 'percentage'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Progress> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('name' in $$props) $$invalidate(0, name = $$props.name);
    		if ('percentage' in $$props) $$invalidate(1, percentage = $$props.percentage);
    	};

    	$$self.$capture_state = () => ({ name, percentage });

    	$$self.$inject_state = $$props => {
    		if ('name' in $$props) $$invalidate(0, name = $$props.name);
    		if ('percentage' in $$props) $$invalidate(1, percentage = $$props.percentage);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [name, percentage];
    }

    class Progress extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, { name: 0, percentage: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Progress",
    			options,
    			id: create_fragment$9.name
    		});
    	}

    	get name() {
    		throw new Error("<Progress>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<Progress>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get percentage() {
    		throw new Error("<Progress>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set percentage(value) {
    		throw new Error("<Progress>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/skills/Native.svelte generated by Svelte v3.55.0 */
    const file$8 = "src/components/skills/Native.svelte";

    function create_fragment$8(ctx) {
    	let div1;
    	let h3;
    	let t1;
    	let div0;
    	let ul;
    	let li;
    	let progress;
    	let current;

    	progress = new Progress({
    			props: { name: "Flutter", percentage: 60 },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			h3 = element("h3");
    			h3.textContent = "Native";
    			t1 = space();
    			div0 = element("div");
    			ul = element("ul");
    			li = element("li");
    			create_component(progress.$$.fragment);
    			attr_dev(h3, "class", "svelte-11ia4lq");
    			add_location(h3, file$8, 5, 2, 90);
    			attr_dev(li, "class", "svelte-11ia4lq");
    			add_location(li, file$8, 8, 6, 129);
    			attr_dev(ul, "class", "svelte-11ia4lq");
    			add_location(ul, file$8, 7, 4, 118);
    			add_location(div0, file$8, 6, 2, 108);
    			attr_dev(div1, "class", "container svelte-11ia4lq");
    			add_location(div1, file$8, 4, 0, 64);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, h3);
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			append_dev(div0, ul);
    			append_dev(ul, li);
    			mount_component(progress, li, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(progress.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(progress.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_component(progress);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Native', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Native> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Progress });
    	return [];
    }

    class Native extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Native",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src/components/skills/Other.svelte generated by Svelte v3.55.0 */

    const file$7 = "src/components/skills/Other.svelte";

    function create_fragment$7(ctx) {
    	let div1;
    	let h3;
    	let t1;
    	let div0;
    	let ul;
    	let li0;
    	let t3;
    	let li1;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			h3 = element("h3");
    			h3.textContent = "Others";
    			t1 = space();
    			div0 = element("div");
    			ul = element("ul");
    			li0 = element("li");
    			li0.textContent = "Git/Github";
    			t3 = space();
    			li1 = element("li");
    			li1.textContent = "Slack";
    			attr_dev(h3, "class", "svelte-ycejey");
    			add_location(h3, file$7, 1, 2, 26);
    			attr_dev(li0, "class", "svelte-ycejey");
    			add_location(li0, file$7, 4, 6, 65);
    			attr_dev(li1, "class", "svelte-ycejey");
    			add_location(li1, file$7, 5, 6, 91);
    			attr_dev(ul, "class", "svelte-ycejey");
    			add_location(ul, file$7, 3, 4, 54);
    			add_location(div0, file$7, 2, 2, 44);
    			attr_dev(div1, "class", "container svelte-ycejey");
    			add_location(div1, file$7, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, h3);
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			append_dev(div0, ul);
    			append_dev(ul, li0);
    			append_dev(ul, t3);
    			append_dev(ul, li1);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Other', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Other> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Other extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Other",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src/components/skills/Web.svelte generated by Svelte v3.55.0 */
    const file$6 = "src/components/skills/Web.svelte";

    function create_fragment$6(ctx) {
    	let div3;
    	let h3;
    	let t1;
    	let div0;
    	let h40;
    	let t3;
    	let ul0;
    	let li0;
    	let progress0;
    	let t4;
    	let li1;
    	let progress1;
    	let t5;
    	let div1;
    	let h41;
    	let t7;
    	let ul1;
    	let li2;
    	let progress2;
    	let t8;
    	let li3;
    	let progress3;
    	let t9;
    	let div2;
    	let h42;
    	let t11;
    	let ul2;
    	let li4;
    	let progress4;
    	let t12;
    	let li5;
    	let progress5;
    	let current;

    	progress0 = new Progress({
    			props: { name: "Vue3", percentage: 70 },
    			$$inline: true
    		});

    	progress1 = new Progress({
    			props: { name: "Svelte", percentage: 60 },
    			$$inline: true
    		});

    	progress2 = new Progress({
    			props: { name: "Gin", percentage: 90 },
    			$$inline: true
    		});

    	progress3 = new Progress({
    			props: { name: "Codeigniter4", percentage: 60 },
    			$$inline: true
    		});

    	progress4 = new Progress({
    			props: { name: "MySQL", percentage: 70 },
    			$$inline: true
    		});

    	progress5 = new Progress({
    			props: { name: "SQlite3", percentage: 70 },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			h3 = element("h3");
    			h3.textContent = "WEB";
    			t1 = space();
    			div0 = element("div");
    			h40 = element("h4");
    			h40.textContent = "Frotend";
    			t3 = space();
    			ul0 = element("ul");
    			li0 = element("li");
    			create_component(progress0.$$.fragment);
    			t4 = space();
    			li1 = element("li");
    			create_component(progress1.$$.fragment);
    			t5 = space();
    			div1 = element("div");
    			h41 = element("h4");
    			h41.textContent = "Backend";
    			t7 = space();
    			ul1 = element("ul");
    			li2 = element("li");
    			create_component(progress2.$$.fragment);
    			t8 = space();
    			li3 = element("li");
    			create_component(progress3.$$.fragment);
    			t9 = space();
    			div2 = element("div");
    			h42 = element("h4");
    			h42.textContent = "Database";
    			t11 = space();
    			ul2 = element("ul");
    			li4 = element("li");
    			create_component(progress4.$$.fragment);
    			t12 = space();
    			li5 = element("li");
    			create_component(progress5.$$.fragment);
    			attr_dev(h3, "class", "svelte-u149h2");
    			add_location(h3, file$6, 5, 2, 90);
    			attr_dev(h40, "class", "svelte-u149h2");
    			add_location(h40, file$6, 7, 4, 115);
    			attr_dev(li0, "class", "svelte-u149h2");
    			add_location(li0, file$6, 9, 6, 147);
    			attr_dev(li1, "class", "svelte-u149h2");
    			add_location(li1, file$6, 10, 6, 205);
    			attr_dev(ul0, "class", "svelte-u149h2");
    			add_location(ul0, file$6, 8, 4, 136);
    			add_location(div0, file$6, 6, 2, 105);
    			attr_dev(h41, "class", "svelte-u149h2");
    			add_location(h41, file$6, 15, 4, 291);
    			attr_dev(li2, "class", "svelte-u149h2");
    			add_location(li2, file$6, 17, 6, 323);
    			attr_dev(li3, "class", "svelte-u149h2");
    			add_location(li3, file$6, 18, 6, 380);
    			attr_dev(ul1, "class", "svelte-u149h2");
    			add_location(ul1, file$6, 16, 4, 312);
    			add_location(div1, file$6, 14, 2, 281);
    			attr_dev(h42, "class", "svelte-u149h2");
    			add_location(h42, file$6, 22, 4, 471);
    			attr_dev(li4, "class", "svelte-u149h2");
    			add_location(li4, file$6, 24, 6, 504);
    			attr_dev(li5, "class", "svelte-u149h2");
    			add_location(li5, file$6, 25, 6, 563);
    			attr_dev(ul2, "class", "svelte-u149h2");
    			add_location(ul2, file$6, 23, 4, 493);
    			add_location(div2, file$6, 21, 2, 461);
    			attr_dev(div3, "class", "container svelte-u149h2");
    			add_location(div3, file$6, 4, 0, 64);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, h3);
    			append_dev(div3, t1);
    			append_dev(div3, div0);
    			append_dev(div0, h40);
    			append_dev(div0, t3);
    			append_dev(div0, ul0);
    			append_dev(ul0, li0);
    			mount_component(progress0, li0, null);
    			append_dev(ul0, t4);
    			append_dev(ul0, li1);
    			mount_component(progress1, li1, null);
    			append_dev(div3, t5);
    			append_dev(div3, div1);
    			append_dev(div1, h41);
    			append_dev(div1, t7);
    			append_dev(div1, ul1);
    			append_dev(ul1, li2);
    			mount_component(progress2, li2, null);
    			append_dev(ul1, t8);
    			append_dev(ul1, li3);
    			mount_component(progress3, li3, null);
    			append_dev(div3, t9);
    			append_dev(div3, div2);
    			append_dev(div2, h42);
    			append_dev(div2, t11);
    			append_dev(div2, ul2);
    			append_dev(ul2, li4);
    			mount_component(progress4, li4, null);
    			append_dev(ul2, t12);
    			append_dev(ul2, li5);
    			mount_component(progress5, li5, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(progress0.$$.fragment, local);
    			transition_in(progress1.$$.fragment, local);
    			transition_in(progress2.$$.fragment, local);
    			transition_in(progress3.$$.fragment, local);
    			transition_in(progress4.$$.fragment, local);
    			transition_in(progress5.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(progress0.$$.fragment, local);
    			transition_out(progress1.$$.fragment, local);
    			transition_out(progress2.$$.fragment, local);
    			transition_out(progress3.$$.fragment, local);
    			transition_out(progress4.$$.fragment, local);
    			transition_out(progress5.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			destroy_component(progress0);
    			destroy_component(progress1);
    			destroy_component(progress2);
    			destroy_component(progress3);
    			destroy_component(progress4);
    			destroy_component(progress5);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Web', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Web> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Progress });
    	return [];
    }

    class Web extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Web",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src/components/works/Goapi.svelte generated by Svelte v3.55.0 */

    const file$5 = "src/components/works/Goapi.svelte";

    function create_fragment$5(ctx) {
    	let div2;
    	let div0;
    	let h3;
    	let t1;
    	let p;
    	let t3;
    	let div1;
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			h3 = element("h3");
    			h3.textContent = "Go lang を用いたRESTful API";
    			t1 = space();
    			p = element("p");
    			p.textContent = "Go言語を用いてRESTful\n      APIサーバーを作成しました。Goの有名ライブラリであるGinを使用しており、高速に動作します。JWT\n      Tokenによる認証系を備えており、ユーザー登録からログイン、退会まで行えます。また設定ファイルの情報によって動作を変更でき、接続するデータベースや開放するポート、開発・リリースモード切り替えを簡単に行うことができます。";
    			t3 = space();
    			div1 = element("div");
    			img = element("img");
    			attr_dev(h3, "class", "title svelte-wsbbl0");
    			add_location(h3, file$5, 6, 4, 111);
    			add_location(p, file$5, 7, 4, 162);
    			attr_dev(div0, "class", "text-explain svelte-wsbbl0");
    			add_location(div0, file$5, 5, 2, 80);
    			if (!src_url_equal(img.src, img_src_value = /*src*/ ctx[0])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "goproject");
    			attr_dev(img, "class", "svelte-wsbbl0");
    			add_location(img, file$5, 13, 29, 410);
    			attr_dev(div1, "class", "image-explain svelte-wsbbl0");
    			add_location(div1, file$5, 13, 2, 383);
    			attr_dev(div2, "class", "container svelte-wsbbl0");
    			add_location(div2, file$5, 4, 0, 54);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, h3);
    			append_dev(div0, t1);
    			append_dev(div0, p);
    			append_dev(div2, t3);
    			append_dev(div2, div1);
    			append_dev(div1, img);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Goapi', slots, []);
    	let src = "./images/gopro.png";
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Goapi> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ src });

    	$$self.$inject_state = $$props => {
    		if ('src' in $$props) $$invalidate(0, src = $$props.src);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [src];
    }

    class Goapi extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Goapi",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src/components/works/Portfolio.svelte generated by Svelte v3.55.0 */

    const file$4 = "src/components/works/Portfolio.svelte";

    // (16:2) {:else}
    function create_else_block(ctx) {
    	let div0;
    	let h3;
    	let t1;
    	let p;
    	let t3;
    	let div1;
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			h3 = element("h3");
    			h3.textContent = "ポートフォリオ";
    			t1 = space();
    			p = element("p");
    			p.textContent = "このサイトです。次世代のフロントエンドフレームワークであるsvelteを勉強したので、実践として作成しました。\n        css、javascriptの勉強も兼ねているのでjQueryやbootstrapといったフレームワークを使わず全て自力で実装してみました。";
    			t3 = space();
    			div1 = element("div");
    			img = element("img");
    			attr_dev(h3, "class", "title svelte-wvpej0");
    			add_location(h3, file$4, 17, 6, 494);
    			add_location(p, file$4, 18, 6, 531);
    			attr_dev(div0, "class", "text-explain svelte-wvpej0");
    			add_location(div0, file$4, 16, 4, 461);
    			if (!src_url_equal(img.src, img_src_value = /*src*/ ctx[0])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "portfolio");
    			attr_dev(img, "class", "svelte-wvpej0");
    			add_location(img, file$4, 23, 31, 731);
    			attr_dev(div1, "class", "image-explain svelte-wvpej0");
    			add_location(div1, file$4, 23, 4, 704);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, h3);
    			append_dev(div0, t1);
    			append_dev(div0, p);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, img);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(16:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (7:2) {#if width > 768}
    function create_if_block$1(ctx) {
    	let div0;
    	let img;
    	let img_src_value;
    	let t0;
    	let div1;
    	let h3;
    	let t2;
    	let p;

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			div1 = element("div");
    			h3 = element("h3");
    			h3.textContent = "ポートフォリオ";
    			t2 = space();
    			p = element("p");
    			p.textContent = "このサイトです。次世代のフロントエンドフレームワークであるsvelteを勉強したので、実践として作成しました。\n        css、javascriptの勉強も兼ねているのでjQueryやbootstrapといったフレームワークを使わず全て自力で実装してみました。";
    			if (!src_url_equal(img.src, img_src_value = /*src*/ ctx[0])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "portfolio");
    			attr_dev(img, "class", "svelte-wvpej0");
    			add_location(img, file$4, 7, 31, 168);
    			attr_dev(div0, "class", "image-explain svelte-wvpej0");
    			add_location(div0, file$4, 7, 4, 141);
    			attr_dev(h3, "class", "title svelte-wvpej0");
    			add_location(h3, file$4, 9, 6, 241);
    			add_location(p, file$4, 10, 6, 278);
    			attr_dev(div1, "class", "text-explain svelte-wvpej0");
    			add_location(div1, file$4, 8, 4, 208);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, img);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, h3);
    			append_dev(div1, t2);
    			append_dev(div1, p);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(7:2) {#if width > 768}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div;

    	function select_block_type(ctx, dirty) {
    		if (/*width*/ ctx[1] > 768) return create_if_block$1;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			attr_dev(div, "class", "container svelte-wvpej0");
    			add_location(div, file$4, 5, 0, 93);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if_block.m(div, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if_block.p(ctx, dirty);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Portfolio', slots, []);
    	let src = "./images/portfolio.png";
    	const width = window.innerWidth;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Portfolio> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ src, width });

    	$$self.$inject_state = $$props => {
    		if ('src' in $$props) $$invalidate(0, src = $$props.src);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [src, width];
    }

    class Portfolio extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Portfolio",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/components/Content.svelte generated by Svelte v3.55.0 */
    const file$3 = "src/components/Content.svelte";

    function create_fragment$3(ctx) {
    	let div1;
    	let div0;
    	let h20;
    	let t1;
    	let goapi;
    	let t2;
    	let portfolio;
    	let t3;
    	let hr;
    	let t4;
    	let h21;
    	let t6;
    	let language;
    	let t7;
    	let web;
    	let t8;
    	let native;
    	let t9;
    	let embedded;
    	let t10;
    	let other;
    	let current;
    	goapi = new Goapi({ $$inline: true });
    	portfolio = new Portfolio({ $$inline: true });
    	language = new Language({ $$inline: true });
    	web = new Web({ $$inline: true });
    	native = new Native({ $$inline: true });
    	embedded = new Embedded({ $$inline: true });
    	other = new Other({ $$inline: true });

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			h20 = element("h2");
    			h20.textContent = "PROJECTS";
    			t1 = space();
    			create_component(goapi.$$.fragment);
    			t2 = space();
    			create_component(portfolio.$$.fragment);
    			t3 = space();
    			hr = element("hr");
    			t4 = space();
    			h21 = element("h2");
    			h21.textContent = "SKILLS";
    			t6 = space();
    			create_component(language.$$.fragment);
    			t7 = space();
    			create_component(web.$$.fragment);
    			t8 = space();
    			create_component(native.$$.fragment);
    			t9 = space();
    			create_component(embedded.$$.fragment);
    			t10 = space();
    			create_component(other.$$.fragment);
    			attr_dev(h20, "id", "projects");
    			attr_dev(h20, "class", "svelte-1kxelrb");
    			add_location(h20, file$3, 12, 4, 406);
    			attr_dev(hr, "class", "svelte-1kxelrb");
    			add_location(hr, file$3, 15, 4, 474);
    			attr_dev(h21, "id", "skills");
    			attr_dev(h21, "class", "svelte-1kxelrb");
    			add_location(h21, file$3, 16, 4, 485);
    			attr_dev(div0, "class", "container");
    			add_location(div0, file$3, 11, 2, 378);
    			attr_dev(div1, "class", "background svelte-1kxelrb");
    			add_location(div1, file$3, 10, 0, 351);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, h20);
    			append_dev(div0, t1);
    			mount_component(goapi, div0, null);
    			append_dev(div0, t2);
    			mount_component(portfolio, div0, null);
    			append_dev(div0, t3);
    			append_dev(div0, hr);
    			append_dev(div0, t4);
    			append_dev(div0, h21);
    			append_dev(div0, t6);
    			mount_component(language, div0, null);
    			append_dev(div0, t7);
    			mount_component(web, div0, null);
    			append_dev(div0, t8);
    			mount_component(native, div0, null);
    			append_dev(div0, t9);
    			mount_component(embedded, div0, null);
    			append_dev(div0, t10);
    			mount_component(other, div0, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(goapi.$$.fragment, local);
    			transition_in(portfolio.$$.fragment, local);
    			transition_in(language.$$.fragment, local);
    			transition_in(web.$$.fragment, local);
    			transition_in(native.$$.fragment, local);
    			transition_in(embedded.$$.fragment, local);
    			transition_in(other.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(goapi.$$.fragment, local);
    			transition_out(portfolio.$$.fragment, local);
    			transition_out(language.$$.fragment, local);
    			transition_out(web.$$.fragment, local);
    			transition_out(native.$$.fragment, local);
    			transition_out(embedded.$$.fragment, local);
    			transition_out(other.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_component(goapi);
    			destroy_component(portfolio);
    			destroy_component(language);
    			destroy_component(web);
    			destroy_component(native);
    			destroy_component(embedded);
    			destroy_component(other);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Content', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Content> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Embedded,
    		Language,
    		Native,
    		Other,
    		Web,
    		Goapi,
    		Portfolio
    	});

    	return [];
    }

    class Content extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Content",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/components/Header.svelte generated by Svelte v3.55.0 */

    const file$2 = "src/components/Header.svelte";

    function create_fragment$2(ctx) {
    	let header;
    	let div;
    	let t1;
    	let nav;
    	let ul;
    	let li0;
    	let a0;
    	let t3;
    	let li1;
    	let a1;
    	let t5;
    	let li2;
    	let a2;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			header = element("header");
    			div = element("div");
    			div.textContent = "Kawai Kenta";
    			t1 = space();
    			nav = element("nav");
    			ul = element("ul");
    			li0 = element("li");
    			a0 = element("a");
    			a0.textContent = "HOME";
    			t3 = space();
    			li1 = element("li");
    			a1 = element("a");
    			a1.textContent = "PROJECTS";
    			t5 = space();
    			li2 = element("li");
    			a2 = element("a");
    			a2.textContent = "SKILLS";
    			attr_dev(div, "class", "logo svelte-14r08hf");
    			add_location(div, file$2, 11, 2, 226);
    			attr_dev(a0, "href", "#title");
    			attr_dev(a0, "class", "svelte-14r08hf");
    			add_location(a0, file$2, 15, 8, 298);
    			attr_dev(li0, "class", "svelte-14r08hf");
    			add_location(li0, file$2, 14, 6, 285);
    			attr_dev(a1, "href", "#projects");
    			attr_dev(a1, "class", "svelte-14r08hf");
    			add_location(a1, file$2, 18, 8, 396);
    			attr_dev(li1, "class", "svelte-14r08hf");
    			add_location(li1, file$2, 17, 6, 383);
    			attr_dev(a2, "href", "#skills");
    			attr_dev(a2, "class", "svelte-14r08hf");
    			add_location(a2, file$2, 22, 8, 510);
    			attr_dev(li2, "class", "svelte-14r08hf");
    			add_location(li2, file$2, 21, 6, 497);
    			attr_dev(ul, "class", "svelte-14r08hf");
    			add_location(ul, file$2, 13, 4, 274);
    			attr_dev(nav, "class", "svelte-14r08hf");
    			add_location(nav, file$2, 12, 2, 264);
    			attr_dev(header, "class", "svelte-14r08hf");
    			add_location(header, file$2, 10, 0, 215);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);
    			append_dev(header, div);
    			append_dev(header, t1);
    			append_dev(header, nav);
    			append_dev(nav, ul);
    			append_dev(ul, li0);
    			append_dev(li0, a0);
    			append_dev(ul, t3);
    			append_dev(ul, li1);
    			append_dev(li1, a1);
    			append_dev(ul, t5);
    			append_dev(ul, li2);
    			append_dev(li2, a2);

    			if (!mounted) {
    				dispose = [
    					listen_dev(a0, "click", prevent_default(/*scrollIntoView*/ ctx[0]), false, true, false),
    					listen_dev(a1, "click", prevent_default(/*scrollIntoView*/ ctx[0]), false, true, false),
    					listen_dev(a2, "click", prevent_default(/*scrollIntoView*/ ctx[0]), false, true, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Header', slots, []);

    	const scrollIntoView = ({ target }) => {
    		const el = document.querySelector(target.getAttribute("href"));
    		if (!el) return;
    		el.scrollIntoView({ behavior: "smooth" });
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Header> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ scrollIntoView });
    	return [scrollIntoView];
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Header",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/components/Title.svelte generated by Svelte v3.55.0 */

    const file$1 = "src/components/Title.svelte";

    function create_fragment$1(ctx) {
    	let div1;
    	let div0;
    	let h1;
    	let t1;
    	let p;
    	let t2;
    	let br;
    	let t3;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Kawai Kenta";
    			t1 = space();
    			p = element("p");
    			t2 = text("Computer Science B4 / Nagoya University");
    			br = element("br");
    			t3 = text("\n      I have a part-time job working as a system engineer");
    			attr_dev(h1, "class", "svelte-jipnug");
    			add_location(h1, file$1, 2, 4, 48);
    			add_location(br, file$1, 4, 45, 122);
    			add_location(p, file$1, 3, 4, 73);
    			attr_dev(div0, "class", "content svelte-jipnug");
    			add_location(div0, file$1, 1, 2, 22);
    			attr_dev(div1, "class", "image svelte-jipnug");
    			add_location(div1, file$1, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, h1);
    			append_dev(div0, t1);
    			append_dev(div0, p);
    			append_dev(p, t2);
    			append_dev(p, br);
    			append_dev(p, t3);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Title', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Title> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Title extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Title",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.55.0 */
    const file = "src/App.svelte";

    // (9:0) {#if width > 768}
    function create_if_block(ctx) {
    	let div;
    	let header;
    	let current;
    	header = new Header({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(header.$$.fragment);
    			attr_dev(div, "class", "header svelte-1feg4zg");
    			add_location(div, file, 9, 2, 229);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(header, div, null);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(header.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(header.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(header);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(9:0) {#if width > 768}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let t0;
    	let section;
    	let title;
    	let t1;
    	let content;
    	let current;
    	let if_block = /*width*/ ctx[0] > 768 && create_if_block(ctx);
    	title = new Title({ $$inline: true });
    	content = new Content({ $$inline: true });

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			t0 = space();
    			section = element("section");
    			create_component(title.$$.fragment);
    			t1 = space();
    			create_component(content.$$.fragment);
    			attr_dev(section, "id", "title");
    			add_location(section, file, 13, 0, 280);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, section, anchor);
    			mount_component(title, section, null);
    			insert_dev(target, t1, anchor);
    			mount_component(content, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			transition_in(title.$$.fragment, local);
    			transition_in(content.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			transition_out(title.$$.fragment, local);
    			transition_out(content.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(section);
    			destroy_component(title);
    			if (detaching) detach_dev(t1);
    			destroy_component(content, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	const width = window.innerWidth;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Content, Header, Title, width });
    	return [width];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    var app = new App({
    	target: document.body
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
