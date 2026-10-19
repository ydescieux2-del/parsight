/**
 * GlowMesh — tiny MeshBuilder helper for the find highlight and arrow: flat-colored boxes and
 * triangles with position / normal / color, drawn with the additive glow material.
 */
export class GlowMesh {
  private verts: number[] = []
  private idx: number[] = []
  private count = 0

  constructor(private color: vec4) {}

  private v(x: number, y: number, z: number, n: vec3): number {
    this.verts.push(x, y, z, n.x, n.y, n.z, this.color.x, this.color.y, this.color.z, this.color.w)
    return this.count++
  }

  tri(a: vec3, b: vec3, c: vec3): void {
    const n = b.sub(a).cross(c.sub(a)).normalize()
    this.idx.push(this.v(a.x, a.y, a.z, n), this.v(b.x, b.y, b.z, n), this.v(c.x, c.y, c.z, n))
  }

  /** Axis-aligned box from min/max corners (all six faces, CCW from outside). */
  box(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number): void {
    const p = [
      new vec3(x0, y0, z0), new vec3(x1, y0, z0), new vec3(x1, y1, z0), new vec3(x0, y1, z0),
      new vec3(x0, y0, z1), new vec3(x1, y0, z1), new vec3(x1, y1, z1), new vec3(x0, y1, z1),
    ]
    const faces = [[0, 3, 2, 1], [4, 5, 6, 7], [0, 1, 5, 4], [3, 7, 6, 2], [0, 4, 7, 3], [1, 2, 6, 5]]
    for (const f of faces) {
      this.tri(p[f[0]], p[f[1]], p[f[2]])
      this.tri(p[f[0]], p[f[2]], p[f[3]])
    }
  }

  /** Adds a RenderMeshVisual with this geometry to `target`. */
  commit(target: SceneObject, material: Material): RenderMeshVisual {
    const b = new MeshBuilder([
      {name: "position", components: 3},
      {name: "normal", components: 3, normalized: true},
      {name: "color", components: 4},
    ])
    b.topology = MeshTopology.Triangles
    b.indexType = MeshIndexType.UInt16
    b.appendVerticesInterleaved(this.verts)
    b.appendIndices(this.idx)
    const rmv = target.createComponent("Component.RenderMeshVisual") as RenderMeshVisual
    rmv.mesh = b.getMesh()
    if (material) rmv.mainMaterial = material
    b.updateMesh()
    return rmv
  }
}
