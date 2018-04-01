

function parse_pud(binAry)
{
    //
    // Parse header JSON
    //
    var str = (new TextDecoder()).decode(binAry)

    var idx = str.indexOf('\0')
    var json = str.slice(0, idx)

    var json = JSON.parse(json)

    if (!json) return null;
    if (!json['details_headers']) return null;

    var hdr = json['details_headers']

    //
    // Analyze data
    //
    idx = 0;
    var view   = new DataView(binAry)

    // Skip to '\0'
    while (idx < binAry.byteLength) {
        if (view.getUint8(idx++) == 0) break;
    }

    var ary = []

    while (idx < binAry.byteLength) {

        var term = [];

        for (var i =0; i<hdr.length; i++) {
            var ttl = hdr[i]['name']
            var typ = hdr[i]['type']
            var siz = hdr[i]['size']

            if (siz <= 0) continue;

            var dt = 0
            if (typ == 'float' || typ == 'double') {
                if (siz == 4) {
                    dt = view.getFloat32(idx, true)
                } else {
                    dt = view.getFloat64(idx, true)
                }
            } else if (typ == "integer") {
                if (siz == 1) {
                    dt = view.getUint8(idx)
                } else if (siz == 2) {
                    dt = view.getInt16(idx, true)
                } else if (siz == 4) {
                    dt = view.getInt32(idx, true)
                }
            }

            idx += siz;

            term[ttl] = dt;
        }

        ary.push(term)
    }

    var hdr_names = []
    for (var i =0; i<hdr.length; i++) {
        hdr_names.push(hdr[i]['name'])
    }

    //
    // Calc Device absolute position
    //
    calc_world_xyz(ary);
    hdr_names.push('device_x');
    hdr_names.push('device_y');
    hdr_names.push('device_z');

    return [hdr_names, ary]
}


function calc_world_xyz(data_ary)
{
    var dev_x = 0
    var dev_y = 0
    var dev_z = 0
    var tm_prv = 0

    for (var i=0; i<data_ary.length; i++) {

        var rec = data_ary[i];
        var tm_delt = rec["time"] - tm_prv;

        if (tm_delt < 0) tm_delt = 0;

        [dev_x, dev_y, dev_z] =
            calc_world_xyz_rec(rec, tm_delt, dev_x, dev_y, dev_z);

        rec["device_x"] = dev_x;
        rec["device_y"] = dev_y;
        rec["device_z"] = dev_z;

        tm_prv = rec["time"]
    }
}


function calc_world_xyz_rec(rec, tm, dev_x, dev_y ,dev_z)
{
    var vx = rec['speed_vx']
    var vy = rec['speed_vy']
    var vz = rec['speed_vz']
    var s_phi = Math.sin(rec['angle_phi'])
    var c_phi = Math.cos(rec['angle_phi'])
    var s_psi = Math.sin(rec['angle_psi'])
    var c_psi = Math.cos(rec['angle_psi'])
    var s_the = Math.sin(rec['angle_theta'])
    var c_the = Math.cos(rec['angle_theta'])

    var a11 = c_psi * c_phi - c_the * s_phi * s_psi
    var a12 = c_psi * s_phi + c_the * c_phi * s_psi
    var a13 = s_psi * s_the
    var a21 =-s_psi * c_phi - c_the * s_phi * c_psi
    var a22 =-s_psi * s_phi + c_the * c_phi * c_psi
    var a23 = c_psi * s_the
    var a31 = s_the * s_phi
    var a32 =-s_the * c_phi
    var a33 = c_the

    var xx = (a11 * vx + a12 * vy + a13 * vz) * tm
    var yy = (a21 * vx + a22 * vy + a23 * vz) * tm
    var zz = (a31 * vx + a32 * vy + a33 * vz) * tm

    return [xx+dev_x, yy+dev_y, zz+dev_z]
}
