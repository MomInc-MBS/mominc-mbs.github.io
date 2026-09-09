"""Rebuild the five MYR5 finger-count variants in the existing anatomy GLB."""
import bpy, math, sys
from pathlib import Path
from mathutils import Vector

root=Path(__file__).parent/'coach-app'/'creature'/'models'
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(root/'anatomy.glb'))
skin=bpy.data.materials.new('MYR5 sculpted skin');skin.diffuse_color=(.20,.048,.32,1);skin.use_nodes=True
bsdf=skin.node_tree.nodes.get('Principled BSDF');bsdf.inputs['Base Color'].default_value=(.20,.048,.32,1);bsdf.inputs['Roughness'].default_value=.48
bsdf.inputs['Subsurface Weight'].default_value=.065

def finish(o,parts):
    o.data.materials.clear();o.data.materials.append(skin);parts.append(o)
    return o

def ellipsoid(name,center,scale,parts):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=16,location=center)
    o=bpy.context.object;o.name=name;o.scale=scale
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    return finish(o,parts)

def tube(name,points,radii,parts):
    # Round, smoothly tapered sections along the centerline. Dense enough to
    # preserve finger gaps when the palm and knuckles are fused below.
    curve=bpy.data.curves.new(name,'CURVE');curve.dimensions='3D';curve.resolution_u=10
    curve.bevel_depth=1;curve.bevel_resolution=4;curve.use_fill_caps=True
    spline=curve.splines.new('BEZIER');spline.bezier_points.add(len(points)-1)
    for p,co,r in zip(spline.bezier_points,points,radii):
        p.co=co;p.radius=r;p.handle_left_type='AUTO';p.handle_right_type='AUTO'
    o=bpy.data.objects.new(name,curve);bpy.context.collection.objects.link(o)
    bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o
    bpy.ops.object.convert(target='MESH');finish(bpy.context.object,parts)
    ellipsoid(name+' pad',points[-1],(radii[-1],)*3,parts)

def build(count):
    prior=bpy.data.objects.get('arms_'+str(count))
    if prior:
        for child in list(prior.children_recursive):bpy.data.objects.remove(child,do_unlink=True)
        bpy.data.objects.remove(prior,do_unlink=True)
    parts=[]
    # Both shoulders still meet the original body and animation pivots.
    tube('Left forearm',[(-.58,-.03,1.508),(-.78,-.02,1.28),(-.92,-.14,1.02),(-.94,-.22,.90)],[.155,.13,.108,.095],parts)
    tube('Right forearm',[(.59,-.04,1.518),(.81,-.12,1.35),(.98,-.33,1.44),(1.05,-.48,1.58)],[.16,.14,.112,.10],parts)
    for side in [-1,1]:
        center=Vector((-.94,-.24,.79) if side<0 else (1.065,-.52,1.72))
        direction=-1 if side<0 else 1
        def at(x,z,depth=0):return center+Vector((x,-depth,direction*z))
        # Palm has a rounded heel, dorsal arch and thumb mound, instead of a ball.
        ellipsoid('Palm arch',center,(.174,.090,.160),parts)
        ellipsoid('Palm heel',at(0,-.09,-.004),(.123,.081,.116),parts)
        ellipsoid('Thumb mound',at(-side*.111,-.025,.035),(.093,.076,.115),parts)
        fingers=count-1
        spacing=.275/max(1,fingers-1)
        radius=min(.053,spacing*.35)
        for i in range(fingers):
            fraction=i/max(1,fingers-1)
            x=(fraction-.5)*.275 if fingers>1 else 0
            length=.225+.065*math.sin(fraction*math.pi)
            # Separate rounded knuckles, staggered lengths and a gentle resting curl.
            spread=x*.20
            pts=[at(x,.086),at(x+spread*.25,.17,.008),at(x+spread*.65,.17+length*.48,.035),at(x+spread,.17+length*.85,.076)]
            tube('Finger '+str(i+1),pts,[radius*1.16,radius,radius*.84,radius*.67],parts)
            ellipsoid('Knuckle',at(x,.149,-.018),(radius*1.13,radius*.83,radius*1.15),parts)
            # Short web at the roots leaves clearly open spaces along each shaft.
            if i:
                ellipsoid('Finger web',at(x-spacing*.5,.082), (spacing*.64,.065,.057),parts)
        thumb=[at(-side*.113,-.035,.026),at(-side*.211,.006,.055),at(-side*.253,.083,.102),at(-side*.223,.157,.141)]
        tube('Opposed thumb',thumb,[.076,.065,.052,.040],parts)
    bpy.ops.object.select_all(action='DESELECT')
    for o in parts:o.select_set(True)
    bpy.context.view_layer.objects.active=parts[0];bpy.ops.object.join();mesh=bpy.context.object
    mesh.name='Sculpted palms and tapered fingers'
    def apply(mod):bpy.ops.object.modifier_apply(modifier=mod.name)
    rem=mesh.modifiers.new('Continuous wrist and palm','REMESH');rem.mode='VOXEL';rem.voxel_size=.007;apply(rem)
    smooth=mesh.modifiers.new('Soften anatomy','SMOOTH');smooth.factor=.45;smooth.iterations=4;apply(smooth)
    dec=mesh.modifiers.new('Phone mesh','DECIMATE');dec.ratio=.4;apply(dec)
    for p in mesh.data.polygons:p.use_smooth=True
    parent=bpy.data.objects.new('arms_'+str(count),None);bpy.context.collection.objects.link(parent);mesh.parent=parent
    mesh['anatomyVersion']=2;mesh['digitsPerHand']=count
    print('SCULPTED',count,len(mesh.data.polygons),flush=True)

for count in range(2,7):build(count)
bpy.ops.object.select_all(action='DESELECT')
for o in bpy.context.scene.objects:
    if o.name.startswith('arms_'):
        o.select_set(True)
        for child in o.children_recursive:child.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(root/'hands-v2.glb'),export_format='GLB',use_selection=True,export_yup=True)
print('HANDS_READY',flush=True)
