export interface ISettings {
  portA: number;
  portB: number;
  mode1: boolean;
  mode2: boolean;
  keepalive: number;
  portHttp: number;
}

export class Settings implements ISettings {
  public data: ISettings;

  public constructor() {
    this.data = {
      mode1: false,
      mode2: true,
      portA: 5901,
      portB: 5500,
      keepalive: 0,
      portHttp: 8080,
    };
  }

  public get keepalive(): number {
    return this.data.keepalive;
  }

  public get mode1(): boolean {
    return this.data.mode1;
  }

  public get mode2(): boolean {
    return this.data.mode2;
  }

  public get portA(): number {
    return this.data.portA;
  }

  public get portB(): number {
    return this.data.portB;
  }

  public get portHttp(): number {
    return this.data.portHttp;
  }
}
