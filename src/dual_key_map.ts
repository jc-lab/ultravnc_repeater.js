interface IWrappedObject<K1, K2, V> {
  key1: K1;
  key2: K2 | undefined;
  value: V;
}

export type KeyType = number | string | symbol;
export class DualKeyMap<K1 extends KeyType, K2 extends KeyType, V> {
  public _primaryMap: Record<K1, IWrappedObject<K1, K2, V>> = {} as any;
  public _secondMap: Record<K2, IWrappedObject<K1, K2, V>> = {} as any;

  public get primaryMap() {
    return this._primaryMap;
  }

  public get secondMap() {
    return this._secondMap;
  }

  public set(key1: K1, key2: K2 | undefined, value: V): void {
    const bag = {key1, key2, value};
    this._primaryMap[key1] = bag;
    if (key2) {
      this._secondMap[key2] = bag;
    }
  }

  public primaryGet(key1: K1): V | undefined {
    const bag = this._primaryMap[key1];
    if (!bag) {
      return undefined;
    }
    return bag.value;
  }

  public secondGet(key2: K2): V | undefined {
    const bag = this._secondMap[key2];
    if (!bag) {
      return undefined;
    }
    return bag.value;
  }

  public primaryRemove(key1: K1): V | undefined {
    const bag = this._primaryMap[key1];
    if (!bag) {
      return undefined;
    }
    delete this._primaryMap[key1];
    if (bag.key2 && this._secondMap[bag.key2]) {
      delete this._secondMap[bag.key2];
    }
    return bag.value;
  }

  public secondRemove(key2: K2): V | undefined {
    const bag = this._secondMap[key2];
    if (!bag) {
      return undefined;
    }
    delete this._secondMap[key2];
    delete this._primaryMap[bag.key1];
    return bag.value;
  }

  public secondSetKey(key1: K1, key2: K2): V | undefined {
    const bag = this._primaryMap[key1];
    if (!bag) {
      return undefined;
    }
    if (bag.key2 && this._secondMap[bag.key2]) {
      delete this._secondMap[bag.key2];
    }
    bag.key2 = key2;
    this._secondMap[key2] = bag;
    return bag.value;
  }
}
