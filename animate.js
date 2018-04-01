
//
// using three.js, webgl framework
//

function exec_animation(elem, dataAry)
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
    var geometry = new THREE.TorusGeometry(0.8, 0.3, 8, 6, Math.PI*2*0.8);
    var material = new THREE.MeshLambertMaterial( {color: 0x0fff0f} );
    var device   = new THREE.Mesh(geometry, material);
    device.rotation.x  = Math.PI / 2;

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
    scene.add(device);
    // scene.add(plane);
	scene.add(light);

    // Camera
	var cam   = new THREE.PerspectiveCamera(
                75, window.innerWidth / window.innerHeight, 0.1, 200
                );
    cam.position.set(20, 20, 20);
    cam.lookAt(new THREE.Vector3(0, 0, 0));

    // Orbit Controller
    var controls = new THREE.OrbitControls(cam);

    // 
    // animation
    // 
    num = dataAry.length * 3;
    line.geometry.setDrawRange(0, num);
    idx = 0;

    var clk = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);
        renderer.render(scene, cam);

        var tm = clk.getElapsedTime() * 1000;
        while (idx < dataAry.length && tm > dataAry[idx]['time']) {
            idx++;
        }
        
        if (idx >= dataAry.length) {
            idx = 0;
            clk.stop();
            clk.start();
        } else {
            interpolate_set(dataAry, tm, idx, device);
        }
    }

    animate();
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
        a = (rec2['time'] - tm) / (rec2['time'] - rec1['time']);
    }

    if (a < 0.0) a = 0.0;
    if (a > 1.0) a = 1.0;

    device.position.x =  (rec2['device_y']*(1-a) + rec1['device_y']*a) / 100;
    device.position.y = -(rec2['device_z']*(1-a) + rec1['device_z']*a) / 100;
    device.position.z =  (rec2['device_x']*(1-a) + rec1['device_x']*a) / 100;

    var psi1 = rec1['angle_psi'];
    var psi2 = rec2['angle_psi'];
    if (psi1 > 0 && psi2 > 0 || psi1 < 0 && psi2 < 0 ) {
    } else {
        if (psi1 < -Math.PI/2 && psi2 > Math.PI/2) {
            psi1 = (psi1 + Math.PI*2)
        } else if (psi2 < -Math.PI/2 && psi1 > Math.PI/2) {
            psi2 = (psi2 + Math.PI*2)
        }
    }

    // Torus
    device.rotation.z = (psi2*(1-a) + psi1*a) - Math.PI/2 + Math.PI*2*0.2/2;
    // Cone
    // device.rotation.z = (psi2*(1-a) + psi1*a)
}

