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
   * all state
   */
  all = 0xf
}
