
//
// using three.js, webgl framework
//

var fov = 90;
var tm_scl = 1.0;

function exec_animation(elem, dataAry, frame_cb)
{
    // Renderer
    var renderer = new THREE.WebGLRenderer();
    // renderer.shadowMap.enabled = true;
    // renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
    renderer.setSize(window.innerWidth, window.innerHeight);
    elem.appendChild(renderer.domElement);

    // Object
    // var geometry = new THREE.RingGeometry(0.5, 1);
    // var geometry = new THREE.ConeGeometry(1, 2, 4);
    // var geometry = new THREE.TorusGeometry(0.8, 0.3, 8, 6, Math.PI*2*0.8);
    // var material = new THREE.MeshLambertMaterial( {color: 0x0fff0f} );
    // var device   = new THREE.Mesh(geometry, material);
    // device.rotation.x  = Math.PI / 2;

    var device;

    // Trace Line
    var positions = new Float32Array(dataAry.length * 3);
    var geometry = new THREE.BufferGeometry();
    geometry.addAttribute(
        'position', new THREE.BufferAttribute(positions, 3));
    var material = new THREE.LineBasicMaterial({
        color: 0x000000, linewidth: 4
    });

    var line = new THREE.Line(geometry, material);
    var poss = line.geometry.attributes.position;
    for (var i=0; i<dataAry.length; i++) {
        poss.array[i*3 + 0] =   dataAry[i]['device_y'] / 100;
        poss.array[i*3 + 1] = - dataAry[i]['device_z'] / 100;
        poss.array[i*3 + 2] =   dataAry[i]['device_x'] / 100;
    }

    // Grid
    var grid = new THREE.GridHelper(50, 10, 0x444400, 0xaaaaaa); // (size, div)

    // Plane
    var geometry = new THREE.PlaneBufferGeometry( 50, 50 );
    var material = new THREE.MeshStandardMaterial( { color: 0xcccccc } )
    var plane    = new THREE.Mesh(geometry, material );
    plane.rotation.x = -Math.PI / 2

    // Light
	light = new THREE.DirectionalLight( 0xffffff, 1, 100 );
	light.position.set( 0, 1, 0 );

    // light.castShadow    = true;
    // device.castShadow   = true;
    // plane.receiveShadow = true;

    // Scene
	var scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xffffff );
    scene.add(line);
    scene.add(grid);
    // scene.add(device);
    // scene.add(plane);
	scene.add(light);

    // Camera
	var cam   = new THREE.PerspectiveCamera(
                fov, window.innerWidth / window.innerHeight, 0.1, 200
                );
	//var cam   = new THREE.OrthographicCamera(
    //            -10,  10,
    //             10, -10, 0.1, 500
    //            );

    cam.position.set(20, 20, 20);
    cam.lookAt(new THREE.Vector3(0, 0, 0));

    // Orbit Controller
    var orbitctrl = new THREE.OrbitControls(cam);

    // 
    // animation
    // 
    num = dataAry.length * 3;
    line.geometry.setDrawRange(0, num);
    idx = 0;

    var clk = new THREE.Clock();

    var mode = 0;

    var ctrl = {
        mode: 1,
        idx:  0,
        tm:   0,
    };

    function animate() {
        requestAnimationFrame(animate);
        renderer.render(scene, cam);

        var tm;
        var idx = ctrl['idx'];

        if (ctrl['mode'] == 0) {
            tm = clk.getElapsedTime() * 1000 * tm_scl;
            while (idx < dataAry.length && tm > dataAry[idx]['time']) {
                idx++;
            }
        } else {
            tm = dataAry[idx]['time'];
        }

        ctrl['idx'] = idx;
        ctrl['tm']  = tm;
        
        if (ctrl['idx'] >= dataAry.length) {
            ctrl['idx'] = 0;
            clk.stop();
            clk.start();
        } else {
            interpolate_set(dataAry, tm, idx, device);
        }

        if (orbitctrl.enabled == false) {
            cam.position.set(device.position.x, device.position.y+1.0, device.position.z);
            cam.rotation.set(device.rotation.x, device.rotation.y, device.rotation.z);
            cam.updateMatrix();
            cam.rotateX(45 * Math.PI / 180);
            cam.rotateY(180 * Math.PI / 180);
        }

        if (frame_cb) {
            frame_cb(ctrl, device);
        }

        if (ctrl['req_chg_view'] == 1) {
            if (orbitctrl.enabled) {
                orbitctrl.enabled = false;
            } else {
                orbitctrl.enabled = true;
            }
            ctrl['req_chg_view'] = 0;
        }
    }

    // 
    //  Load Model, then Start Animation
    // 
    var callbackOnLoad = function (event) {
        device = event.detail.loaderRootNode;
        device.rotation.y  = Math.PI / 2;
        device.scale.x = 0.25;
        device.scale.y = 0.25;
        device.scale.z = 0.25;
	    scene.add(event.detail.loaderRootNode);
        animate();
    };

    var loader = new THREE.OBJLoader2();
    // load a resource from provided URL synchronously
    loader.load( 'drone.obj', callbackOnLoad, null, null, null, true);
}

function interpolate_set(dataAry, tm, idx, device)
{
    var a = 0;
    var rec1, rec2;
    if (idx <= 0) {
        rec1 = rec2 = dataAry[idx];
        a = 1.0;
    } else {
        rec1 = dataAry[idx-1];
        rec2 = dataAry[idx];
        if (rec2['time'] != rec1['time']) {
            a = (rec2['time'] - tm) / (rec2['time'] - rec1['time']);
        } else {
            a = 1.0;
        }
    }

    if (a < 0.0) a = 0.0;
    if (a > 1.0) a = 1.0;

    device.position.x =  (rec2['device_y']*(1-a) + rec1['device_y']*a) / 100;
    device.position.y = -(rec2['device_z']*(1-a) + rec1['device_z']*a) / 100;
    device.position.z =  (rec2['device_x']*(1-a) + rec1['device_x']*a) / 100;

    var psi1 = rec1['angle_psi'];
    var psi2 = rec2['angle_psi'];
    if ((psi1 > 0 && psi2 > 0) || (psi1 < 0 && psi2 < 0)) {
    } else {
        if (psi1 < -Math.PI/2 && psi2 > Math.PI/2) {
            psi1 = (psi1 + Math.PI*2);
        } else if (psi2 < -Math.PI/2 && psi1 > Math.PI/2) {
            psi2 = (psi2 + Math.PI*2);
        }
    }

    var phi1 = rec1['angle_phi'];
    var phi2 = rec2['angle_phi'];
    var the1 = rec1['angle_theta'];
    var the2 = rec2['angle_theta'];

    // Torus
    //device.rotation.z = (psi2*(1-a) + psi1*a) - Math.PI/2 + Math.PI*2*0.2/2;
    // Cone
    // device.rotation.z = (psi2*(1-a) + psi1*a)
    // DroneModel
    device.rotation.y = -((psi2*(1-a) + psi1*a));
    device.rotation.x = -(the2*(1-a) + the1*a);
    device.rotation.z = -(phi2*(1-a) + phi1*a);
}

