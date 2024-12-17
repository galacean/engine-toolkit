/**
 * Gizmo State
 */
export enum State {
  /**
   * translate state
   */
  translate = 0x1,
  /**
   * rotate state
   */
  rotate = 0x2,
  /**
   * scale state
   */
  scale = 0x4,
  /**
   * translate , rotate and scale
   */
  all = 0x7,
  /**
   * rect
   */
  rect = 0x8
}
