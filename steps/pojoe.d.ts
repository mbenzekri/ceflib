import { Declaration, Flowchart, Testcase, ParamsMap, TypedParamsMap, State, PipeObj, StepObj } from './types';
declare const SOP = "SOP";
declare const EOP = "EOP";
declare type TypeStep = {
    new (params: ParamsMap): Step;
    declaration: Declaration;
};
/**
 * class defining a batch to run in cloud engine factory
 * @member batch the js plain object description
 * @member steps all the steps of this batch
 * @member globs globals variables for this batch
 * @member argv collected arguments from either process.argv or env variables
 */
declare class Batch {
    private _flowchart;
    private _steps;
    private _globs;
    private _args;
    private _startdate;
    private _enddate;
    constructor(flowchart: Flowchart);
    readonly startdate: Date;
    readonly enddate: Date;
    readonly flowchart: Flowchart;
    readonly steps: Map<string, Step>;
    readonly globs: any;
    readonly args: any;
    toString(): string;
    error(message: string): void;
    validate(): string[];
    private initargs;
    private initglobs;
    static load(gitid: string): TypeStep;
    /**
     * method to add a step to this batch
     * @param {Step} step: a step to add to this batch
     */
    private initsteps;
    private logcounts;
    run(stepscb?: (steps: Step[]) => void): Promise<void>;
}
declare class Pipe {
    readonly tmpfile: string;
    private _towrite;
    readonly capacity = 20000;
    private _consumed;
    private _readers;
    private _writer;
    readonly readended: boolean;
    readonly writeended: boolean;
    readonly ended: boolean;
    readonly hasreaders: boolean;
    private fwdwrite;
    private open;
    private close;
    private releasereaders;
    private releasewriter;
    private write;
    private read;
    private awaitreader;
    private awaitwriter;
    addreader(reader: InputPort): void;
    isdone(port: InputPort): boolean;
    pop(reader: InputPort): Promise<any>;
    push(item: any): Promise<any>;
}
/**
 * class defining a port either an input port or an output port
 * port state is first idle
 * port state is started after receiving SOF (start of flow pojo)
 * port state is ended after receiving EOF (end of flow pojo)
 */
declare abstract class Port {
    readonly name: string;
    readonly step: Step;
    protected state: State;
    protected _count: number;
    readonly count: number;
    readonly isinput: boolean;
    readonly isoutput: boolean;
    readonly isconnected: boolean;
    readonly isstarted: boolean;
    readonly isended: boolean;
    readonly isidle: boolean;
    constructor(name: string, step: Step);
    protected setState(pojo: any): void;
}
declare class OutputPort extends Port {
    readonly pipe: Pipe;
    readonly isoutput: boolean;
    readonly isconnected: boolean;
    put(pojo: any): Promise<void>;
}
declare class InputPort extends Port {
    private pipes;
    private _eopcnt;
    readonly isinput: boolean;
    readonly isconnected: boolean;
    constructor(name: string, step: Step);
    from(pipe: Pipe): void;
    protected setState(pojo: any): void;
    get(): Promise<any>;
}
/**
 * @class Step
 * extend this class to define the behavior of a new kind of step for the cloud batch
 * this class is used during execution time to process each step
 * @property id : step id
 * @property decl : the step declaration
 * @property batch : the batch containing this step
 * @property pipes : pipes output of this step
 * @property ports : input/output ports of this step
 * @property pojo : current pojo (available after first input)
 * @property params : parameters (dynamic see Proxy in constructor)
 */
declare abstract class Step {
    private _startdate;
    private _enddate;
    static register(aclass: TypeStep): void;
    static getstep(stepid: string): TypeStep;
    protected readonly locals: {
        [key: string]: any;
    };
    readonly id: any;
    readonly decl: Declaration;
    private _inports;
    private _outports;
    private _pojo;
    private _params;
    /**
     * start() method may be implemented by heriting classes
     * start() is called for a step at batch ignition
     */
    start(): Promise<void>;
    /**
     * end() method may be implemented by heriting classes
     * end() is called when step finished process()
     */
    end(): Promise<void>;
    /**
     * abstract input() method must be implemented by heriting classes
     * input() is called for each received pojo
     * @param inport input port name receiving the pojo
     * @param pojo the received pojo
     */
    input(inport: string, pojo: any): Promise<any>;
    /**
     * abstract process() method must be implemented by heriting classes
     */
    process(): Promise<any>;
    /**
     * constructor
     * @param decl declaration object for the step
     * @param params parameters expressions for the step
     * @param batch the batch containing this step
     */
    protected constructor(decl: Declaration, params: ParamsMap);
    readonly startdate: Date;
    readonly enddate: Date;
    readonly type: string;
    readonly paramlist: string[];
    readonly params: any;
    readonly inports: InputPort[];
    readonly outports: OutputPort[];
    readonly isinitial: boolean;
    readonly isfinal: boolean;
    outport(name: string): OutputPort;
    inport(name: string): InputPort;
    toString(): string;
    isinport(portname: string): boolean;
    isoutport(portname: string): boolean;
    port(name: string): Port;
    log(message: string): void;
    error(message: string): void;
    debug(message: string): void;
    inconnected(port: string): boolean;
    outconnected(port: string): boolean;
    /**
     * initialize dynamic step parameter access
     * @param args: arguments map provided by the batch
     * @param globs: globs map provided by the batch
     */
    initparams(args: any, globs: any): void;
    private init;
    private terminate;
    /**
     * dry up a port to receive all inputed data through a given port
     * @param port port to dry up
     */
    private dryup;
    /**
     * dry up all ports to receive all inputed data through all ports
     * @param port port to dry up
     */
    private pump;
    /**
     * method to connect this step with a data pipe
     * @param outport name of the output port in this step
     * @param inport name of the input port in the target step
     * @param target target step of the pipe (where data flow)
     * @param filter filter function for flowing data
     */
    connect(outport: OutputPort, inport: InputPort, filter?: (f: any) => boolean): void;
    /**
     * method to output a pojo throw the corresponding port
     * @param {string} outport: a port name
     * @param {any} pojo: the pojo to output
     */
    output(outport: string, pojo: any): Promise<void>;
    exec(): Promise<void>;
}
declare class Testbed extends Batch {
    static globs(globs1: TypedParamsMap, globs2: TypedParamsMap): TypedParamsMap;
    static pipes(stepid: string): PipeObj[];
    static steps(stepid: string, params: ParamsMap): StepObj[];
    constructor(testcase: Testcase);
    static header(state: string, tested: Step): void;
    static run(tests: Testcase[], debug?: boolean): Promise<void>;
}
export { Declaration, Flowchart, Testcase, Batch, Testbed, Step, ParamsMap, SOP, EOP };
