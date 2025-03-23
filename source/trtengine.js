const trtengine = {};

trtengine.ModelFactory = class {

    async match(context) {
        const obj = await context.peek('json');
        if (obj && obj.Layers && Array.isArray(obj.Layers)) {
            return context.set('TRTEngine', obj);
        }
        return null;
    }

    async open(context) {
        const metadata = await context.metadata('trtengine-metadata.json');
        return new trtengine.Model(metadata, context.value);
    }
};

trtengine.Model = class {

    constructor(metadata, symbol) {
        this.format = 'TRTEngine';
        this.graphs = [new trtengine.Graph(metadata, symbol)];
    }
};

trtengine.Graph = class {

    constructor(metadata, symbol) {
        this.nodes = [];
        this.inputs = [];
        this.outputs = [];
        for (const layer of symbol.Layers) {
            this.nodes.push(new trtengine.Node(metadata, layer));
        }
    }
};

trtengine.Node = class {

    constructor(metadata, node) {
        this.name = node.Name;
        this.type = { name: node.LayerType };
        this.attributes = [];
        this.inputs = node.Inputs.map((input) => new trtengine.Argument(input, node));
        this.outputs = node.Outputs.map((output) => new trtengine.Argument(output, node));
    }
};

trtengine.Argument = class {

    constructor(arg, node) {
        this.node = node;
        this.name = arg.Name;
        this.value = [{ name: arg.Name, type: new trtengine.TensorType(arg['Format/Datatype'], new trtengine.TensorShape(arg.Dimensions)) }];
        this.visible = true;
    }
};

trtengine.TensorType = class {
    constructor(dataType, shape) {
        this.dataType = dataType;
        this.shape = shape;
    }

    toString() {
        return `${this.dataType}${this.shape}`;
    }
};

trtengine.TensorShape = class {
    constructor(shape) {
        this.shape = shape;
    }

    toString() {
        if (this.shape.length === 0) {
            return '';
        }
        return `[${this.shape.join(',')}]`;
    }
};

trtengine.Error = class extends Error {

    constructor(message) {
        super(message);
        this.name = 'Error loading TRTEngine graph.';
    }
};

export const ModelFactory = trtengine.ModelFactory;