import { Entity, GLTFResource, PrefabResource, Script, XRManager } from "@galacean/engine";
import { XRFeature, XRSessionState, XRTrackableFeature, XRTracked } from "@galacean/engine-xr";
import { TrackedComponent } from "../component/TrackedComponent";

export abstract class XRTrackedObjectManager<T extends XRTracked> extends Script {
  /**
   * The prefab that is automatically mounted when the object is tracked.
   *
   * @remarks
   * If you set a Prefab, a Prefab instance will be created when the object is tracked,
   * if you set a GLTFResource, the scene root of the GLTFResource will be used,
   * If you set an Entity, the entity.Clone() will be used.
   * otherwise, a new empty Entity will be used instead
   */
  prefab: GLTFResource | PrefabResource | Entity;

  private _feature: TFeatureConstructor<XRTrackableFeature>;
  private _trackIdToIndex: number[] = [];
  private _trackedComponents: Array<TrackedComponent<T>> = [];

  constructor(entity: Entity, feature: TFeatureConstructor<XRTrackableFeature>) {
    super(entity);
    this._feature = feature;
    this._onTrackedChanged = this._onTrackedChanged.bind(this);
    this._onSessionChanged = this._onSessionChanged.bind(this);
  }

  /**
   * Get tracked component by its track ID.
   * @param trackId - The track ID of the tracked object
   * @returns The tracked component
   */
  getTrackedComponentByTrackId(trackId: number): TrackedComponent<T> {
    const index = this._trackIdToIndex[trackId];
    return index !== undefined ? this._trackedComponents[index] : undefined;
  }

  override onEnable(): void {
    this.engine.xrManager?.sessionManager.addStateChangedListener(this._onSessionChanged);
  }

  override onDisable(): void {
    const { xrManager } = this.engine;
    if (!xrManager) return;
    xrManager.getFeature(this._feature)?.removeChangedListener(this._onTrackedChanged);
    xrManager.sessionManager.removeStateChangedListener(this._onSessionChanged);
  }

  protected abstract _initXRFeature(): void;

  private _onSessionChanged(state: XRSessionState): void {
    switch (state) {
      case XRSessionState.Initializing:
        this._initXRFeature();
        break;
      case XRSessionState.Initialized:
        const feature = this._engine.xrManager.getFeature(this._feature);
        if (feature) {
          feature.addChangedListener(this._onTrackedChanged);
        } else {
          console.error("XRTrackedObjectManager: Feature ", this._feature.name, " not found");
        }
        break;
      default:
        break;
    }
  }

  private _onTrackedChanged(added: readonly T[], updated: readonly T[], removed: readonly T[]) {
    if (added.length > 0) {
      for (let i = 0, n = added.length; i < n; i++) {
        this._createOrUpdateTrackedComponents(added[i]);
      }
    }
    if (updated.length > 0) {
      for (let i = 0, n = updated.length; i < n; i++) {
        this._createOrUpdateTrackedComponents(updated[i]);
      }
    }
    if (removed.length > 0) {
      const { _trackIdToIndex: trackIdToIndex, _trackedComponents: trackedComponents } = this;
      for (let i = 0, n = removed.length; i < n; i++) {
        const { id } = removed[i];
        const index = trackIdToIndex[id];
        if (index !== undefined) {
          const trackedComponent = trackedComponents[index];
          trackedComponents.splice(index, 1);
          delete trackIdToIndex[id];
          if (trackedComponent.destroyedOnRemoval) {
            trackedComponent.entity.destroy();
          } else {
            trackedComponent.entity.parent = null;
          }
        }
      }
    }
  }

  private _createOrUpdateTrackedComponents(sessionRelativeData: T): TrackedComponent<T> {
    let trackedComponent = this.getTrackedComponentByTrackId(sessionRelativeData.id);
    if (!trackedComponent) {
      const { _trackIdToIndex: trackIdToIndex, _trackedComponents: trackedComponents } = this;
      trackedComponent = this._createTrackedComponents(sessionRelativeData);
      trackIdToIndex[sessionRelativeData.id] = trackedComponents.length;
      trackedComponents.push(trackedComponent);
    }
    trackedComponent.data = sessionRelativeData;
    const { transform } = trackedComponent.entity;
    const { pose } = sessionRelativeData;
    transform.position = pose.position;
    transform.rotationQuaternion = pose.rotation;
    return trackedComponent;
  }

  private _createTrackedComponents(sessionRelativeData: T): TrackedComponent<T> {
    const { origin } = this._engine.xrManager;
    const { prefab } = this;
    let entity: Entity;
    if (!prefab) {
      entity = origin.createChild("TrackedImage" + sessionRelativeData.id);
    } else {
      if (prefab instanceof GLTFResource) {
        entity = prefab.instantiateSceneRoot();
      } else if (prefab instanceof PrefabResource) {
        entity = prefab.instantiate();
      } else {
        entity = prefab.clone();
      }
      entity.name = "TrackedImage" + sessionRelativeData.id;
      origin.addChild(entity);
    }

    return entity.addComponent(TrackedComponent<T>);
  }
}

type TFeatureConstructor<T extends XRFeature> = new (xrManager: XRManager, ...args: any[]) => T;
