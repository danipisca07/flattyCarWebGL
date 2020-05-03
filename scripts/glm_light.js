/*************************** GLM *********************************/ 
	function Group() {
	  this.name;           /* name of this group */
	  this.numtriangles;   /* number of triangles in this group */
	  this.triangles;      /* array of triangle indices */
	  this.material;       /* index to material for group */
	  //struct _GLMgroup* next;           /* pointer to next group in model */
	};

	function Model() {//filename) {
		//if (filename==undefined) {
			//this.model = {
				this.mtllibname        = null;
				this.numvertices       = 0;
				this.vertices          = null;
				this.numnormals        = 0;
				this.normals           = null;
				this.numcurvatures     = 0;
				this.curvatures        = null;
				this.numvcolors        = 0;
				this.vcolors           = null;
				this.numcombcurvatures = 0;
				this.combcurvatures    = null;
				this.numtexcoords      = 0;
				this.texcoords         = null;
				this.numfacetnorms     = 0;
				this.facetnorms        = null;
				this.numtriangles      = 0;
				this.triangles         = [];
				this.nummaterials      = 0;
				this.materials         = null;
				this.numgroups         = 0;
				this.groups            = [];
				this.position          = [0.0, 0.0, 0.0];
				this.material = {ambient: 0.2, diffuse: 0.5, shininess: 10.0};
			//}
		/*}
		else {
			this.model = this.ReadOBJ(filename, this);
		}*/				
		return this;	
	};
	
	Model.prototype.FindGroup = function(name) {
	    //GLMgroup* group;
	   var found = false;
	   var group = null;
 
	   for (var i=0; i<this.groups.length && !found; i++) {
		if (name == this.groups[i]) {
			group = this.groups[i];
			found = true;
		}
	   }
	    
	   return group; 
	}

	Model.prototype.AddGroup = function(name) {
	    var group = this.FindGroup(name);
	    if (!group) {
		//group = new Group(); //(GLMgroup*)malloc(sizeof(GLMgroup));
		group = {
			name         : name,
			material     : 0,
			numtriangles : 0,
			triangles    : [],
		}
		//group.next = this.model.groups;
		this.groups.push(group);
		this.numgroups++;
	    }
	    
	    return group;
	};

	Model.prototype.Cross = function(u, v) {
	    return [u[1]*v[2] - u[2]*v[1], u[2]*v[0] - u[0]*v[2], u[0]*v[1] - u[1]*v[0]];
	    /*n[0] = u[1]*v[2] - u[2]*v[1];
	    n[1] = u[2]*v[0] - u[0]*v[2];
	    n[2] = u[0]*v[1] - u[1]*v[0];*/
	}

	Model.prototype.Normalize = function(v) {
	    var l = Math.sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2]);
	    v[0] /= l;
	    v[1] /= l;
	    v[2] /= l;
	    return v;
	}

	Model.prototype.Dot = function(u,v)
	{
	    return u[0]*v[0] + u[1]*v[1] + u[2]*v[2];
	}


	Model.prototype.FacetNormals = function() {
	    var u = new Float64Array(3);
	    var v = new Float64Array(3);

	    if (this == null || this == undefined)
		return;
	    if (this.vertices == null || this.vertices == undefined)
		return;
	    
	    // clobber any old facetnormals 
	    if (this.facetnorms)
		this.facetnorms=null;
	    
	    // allocate memory for the new facet normals 
	    this.numfacetnorms = this.numtriangles;
	    this.facetnorms = new Float64Array(3 * (this.numfacetnorms+1)); //(GLfloat*)malloc(sizeof(GLfloat) *
			       //3 * (model.numfacetnorms + 1));
	    for (var i = 0; i < this.numtriangles; i++) {
		this.triangles[i].findex = i+1;
		
		u[0] = this.vertices[3 * this.triangles[i].vindices[1] + 0] -
		    this.vertices[3 * this.triangles[i].vindices[0] + 0];
		u[1] = this.vertices[3 * this.triangles[i].vindices[1] + 1] -
		    this.vertices[3 * this.triangles[i].vindices[0] + 1];
		u[2] = this.vertices[3 * this.triangles[i].vindices[1] + 2] -
		    this.vertices[3 * this.triangles[i].vindices[0] + 2];
		
		v[0] = this.vertices[3 * this.triangles[i].vindices[2] + 0] -
		    this.vertices[3 * this.triangles[i].vindices[0] + 0];
		v[1] = this.vertices[3 * this.triangles[i].vindices[2] + 1] -
		    this.vertices[3 * this.triangles[i].vindices[0] + 1];
		v[2] = this.vertices[3 * this.triangles[i].vindices[2] + 2] -
		    this.vertices[3 * this.triangles[i].vindices[0] + 2];
		
		var cross = new Float64Array(3);
		cross = this.Cross(u, v);
		//this.facetnorms[3 * (i+1)]=cross[0];    //this.Cross(u, v);
		//this.facetnorms[3 * (i+1)+1]=cross[1];    //this.Cross(u, v);
		//this.facetnorms[3 * (i+1)+2]=cross[2];    //this.Cross(u, v);
		var norm = new Float64Array(3);
		norm = this.Normalize(cross);
		this.facetnorms[3 * (i+1)]=norm[0];
		this.facetnorms[3 * (i+1)+1]=norm[1];
		this.facetnorms[3 * (i+1)+2]=norm[2];
		//this.facetnorms[3 * (i+1)]=this.Normalize(this.facetnorms[3 * (i+1)]);
	    }
	}

Model.prototype.Unitize = function(scale, cx, cy, cz) {
    var  i;
    var maxx, minx, maxy, miny, maxz, minz;
    var w, h, d;
    
    
    /* get the max/mins */
    maxx = minx = this.vertices[3 + 0];
    maxy = miny = this.vertices[3 + 1];
    maxz = minz = this.vertices[3 + 2];
    for (i = 1; i <= this.numvertices; i++) {
        if (maxx < this.vertices[3 * i + 0])
            maxx = this.vertices[3 * i + 0];
        if (minx > this.vertices[3 * i + 0])
            minx = this.vertices[3 * i + 0];
        
        if (maxy < this.vertices[3 * i + 1])
            maxy = this.vertices[3 * i + 1];
        if (miny > this.vertices[3 * i + 1])
            miny = this.vertices[3 * i + 1];
        
        if (maxz < this.vertices[3 * i + 2])
            maxz = this.vertices[3 * i + 2];
        if (minz > this.vertices[3 * i + 2])
            minz = this.vertices[3 * i + 2];
    }
    
    /* calculate model width, height, and depth */
//     w = glmAbs(maxx) + glmAbs(minx);
//     h = glmAbs(maxy) + glmAbs(miny);
//     d = glmAbs(maxz) + glmAbs(minz);
    w = maxx - minx;
    h = maxy - miny;
    d = maxz - minz;
    
    /* calculate center of the model */
    cx = (maxx + minx) / 2.0;
    cy = (maxy + miny) / 2.0;
    cz = (maxz + minz) / 2.0;
    
    /* calculate unitizing scale factor */
    scale = 2.0 / Math.max(Math.max(w, h), d);
    //scale = 2.0 / glmMax(glmMax(w, h), d);
    
    /* translate around center then scale */
    for (i = 1; i <= this.numvertices; i++) {
        this.vertices[3 * i + 0] -= (cx);
        this.vertices[3 * i + 1] -= (cy);
        this.vertices[3 * i + 2] -= (cz);
        this.vertices[3 * i + 0] *= (scale);
        this.vertices[3 * i + 1] *= (scale);
        this.vertices[3 * i + 2] *= (scale);
    }

    return {
	scale: scale,
	cx: cx,
	cy: cy,
	cz: cz,
    }
}

/* TranslateScale: Translates and Scales a model by a given amount.
 * 
 * model - properly initialized GLMmodel structure
 */
//GLvoid glmTranslateScale(GLMmodel* model, GLfloat scale, GLfloat cx, GLfloat cy, GLfloat cz)
Model.prototype.TranslateScale = function(scale, cx, cy, cz)
{
    var i;
    
    /* translate around center then scale */
    for (i = 1; i <= this.numvertices; i++) {
        this.vertices[3 * i + 0] -= cx;
        this.vertices[3 * i + 1] -= cy;
        this.vertices[3 * i + 2] -= cz;
        this.vertices[3 * i + 0] *= scale;
        this.vertices[3 * i + 1] *= scale;
        this.vertices[3 * i + 2] *= scale;
//        model.normals[3 * i + 0] -= cx;
//        model.normals[3 * i + 1] -= cy;
//        model.normals[3 * i + 2] -= cz;
        this.normals[3 * i + 0] *= scale;
        this.normals[3 * i + 1] *= scale;
        this.normals[3 * i + 2] *= scale;
    }
}


function Node() {
	this.index = null;
	this.averaged = null;
	this.next = null;
}

Model.prototype.VertexNormals = function(angle) {
	var node = [];// = new Array(new Node());
	var tail;// = new Array(new Node());
	var members;
	var normals;
	var  numnormals;
	var average = new Float64Array(3);
	var dot, cos_angle;
	var  i, j, avg;
	
	/* calculate the cosine of the angle (in degrees) */
	cos_angle = Math.cos(angle * Math.PI / 180.0);
	
	/* nuke any previous normals */
	if (this.normals)
	this.normals = null;
	
	/* allocate space for new normals */
	this.numnormals = 0;
	for (i = 0; i < this.numtriangles; i++)
		this.numnormals += this.triangles[i].nv;
//    model.numnormals = model.numtriangles * 3; /* 3 normals per triangle */
	this.normals = new Float64Array(3*(this.numnormals+1)); //(GLfloat*)malloc(sizeof(GLfloat)* 3* (model.numnormals+1));
	
	/* allocate a structure that will hold a linked list of triangle
	indices for each vertex */
	members = new Array(this.numvertices+1); //(GLMnode**)malloc(sizeof(GLMnode*) * (model.numvertices + 1));
	for (i = 1; i <= this.numvertices; i++)
	members[i] = new Array(null);//new Array(4);

	
	/* for every triangle, create a node for each vertex in it */
	for (i = 0; i < this.numtriangles; i++) {
	//var k = 0;
		for (j = 0; j < this.triangles[i].nv; j++) {
	var N=new Node();
	N.index = i;
	if (members[this.triangles[i].vindices[j]]==null)
		N.next = null;
	else
		N.next = this.triangles[i].vindices[j];
	//N.next = members[this.triangles[i].vindices[j]];
	members[this.triangles[i].vindices[j]].unshift(N);//k++;
	//node.push(N);
	//members.push(N);
		}

	}
		
	/* calculate the average normal for each vertex */
	numnormals = 1;
	for (i = 1; i <= this.numvertices; i++) {
	/* calculate an average normal for this vertex by averaging the
	facet normal of every triangle this vertex is in */
	var k = 0;
	node = members[i][0];
	//if (!node)
		//  console.log("VertexNormals(): vertex w/o a triangle",node,members[i],i);
	average[0] = 0.0; average[1] = 0.0; average[2] = 0.0;
	avg = 0;
	while (node) {
	/* only average if the dot product of the angle between the two
	facet normals is greater than the cosine of the threshold
	angle -- or, said another way, the angle between the two
		facet normals is less than (or equal to) the threshold angle */
		var u = new Float64Array(3);
		var v = new Float64Array(3);
		u[0] = this.facetnorms[3 * this.triangles[node.index].findex];
		u[1] = this.facetnorms[3 * this.triangles[node.index].findex]+1;
		u[2] = this.facetnorms[3 * this.triangles[node.index].findex]+2;
		v[0] = this.facetnorms[3 * this.triangles[members[i][0].index].findex];
		v[1] = this.facetnorms[3 * this.triangles[members[i][0].index].findex]+1;
		v[2] = this.facetnorms[3 * this.triangles[members[i][0].index].findex]+2;
		dot = this.Dot(u,v);
		//dot = this.Dot(this.facetnorms[3 * this.triangles[node.index].findex],
	//	this.facetnorms[3 * this.triangles[members[i][0].index].findex]);
		if (dot > cos_angle) {
		node.averaged = true;
		average[0] += this.facetnorms[3 * this.triangles[node.index].findex + 0];
		average[1] += this.facetnorms[3 * this.triangles[node.index].findex + 1];
		average[2] += this.facetnorms[3 * this.triangles[node.index].findex + 2];
		avg = 1;            /* we averaged at least one normal! */
		} else {
		node.averaged = false;
		}
		node = members[i][++k];//node.next;
	}
	
	if (avg) {
		/* normalize the averaged normal */
		this.Normalize(average);
		
		/* add the normal to the vertex normals list */
		this.normals[3 * numnormals + 0] = average[0];
		this.normals[3 * numnormals + 1] = average[1];
		this.normals[3 * numnormals + 2] = average[2];
		avg = numnormals;
		numnormals++;
	}
	
	/* set the normal of this vertex in each triangle it is in */
	var h=0;
	node = members[i][0];
	while (node) {
		if (node.averaged) {
		/* if this node was averaged, use the average normal */
		for (j = 0; j < this.triangles[node.index].nv; j++)
			if (this.triangles[node.index].vindices[j] == i)
				this.triangles[node.index].nindices[j] = avg;
/*
		if (this.triangles[node[k].index].vindices[0] == i)
			this.triangles[node[k].index].nindices[0] = avg;
		else if (this.triangles[node[k].index].vindices[1] == i)
			this.triangles[node[k].index].nindices[1] = avg;
		else if (this.triangles[node[k].index].vindices[2] == i)
			this.triangles[node[k].index].nindices[2] = avg;
*/
		} else {
		/* if this node wasn't averaged, use the facet normal */
		this.normals[3 * numnormals + 0] = 
			this.facetnorms[3 * this.triangles[node.index].findex + 0];
		this.normals[3 * numnormals + 1] = 
			this.facetnorms[3 * this.triangles[node.index].findex + 1];
		this.normals[3 * numnormals + 2] = 
			this.facetnorms[3 * this.triangles[node.index].findex + 2];
		for (j = 0; j < this.triangles[node.index].nv; j++)
			if (this.triangles[node.index].vindices[j] == i)
				this.triangles[node.index].nindices[j] = numnormals;
/*
		if (this.triangles[node[k].index].vindices[0] == i)
			this.triangles[node[k].index].nindices[0] = numnormals;
		else if (this.triangles[node[k].index].vindices[1] == i)
			this.triangles[node[k].index].nindices[1] = numnormals;
		else if (this.triangles[node[k].index].vindices[2] == i)
			this.triangles[node[k].index].nindices[2] = numnormals;
*/
		numnormals++;
		}
		node = members[i][++h];//node.next;
	}
	}
	
	this.numnormals = numnormals - 1;
	/* free the member information */
	
	/*for (i = 1; i <= this.numvertices; i++) {
	node = members[i];
	while (node) {
		tail = node;
		node = node.next;
		free(tail);
	}
	}*/
	//free(members);
	members = null;

	/* pack the normals array (we previously allocated the maximum
	number of normals that could possibly be created (numtriangles *
	3), so get rid of some of them (usually alot unless none of the
	facet normals were averaged)) */
	normals = this.normals;
	this.normals = new Float64Array(3*(this.numnormals+1));//(GLfloat*)malloc(sizeof(GLfloat)* 3* (model.numnormals+1));
	for (i = 1; i <= this.numnormals; i++) {
	this.normals[3 * i + 0] = normals[3 * i + 0];
	this.normals[3 * i + 1] = normals[3 * i + 1];
	this.normals[3 * i + 2] = normals[3 * i + 2];
	}
	//free(normals);
	normals = null;
}

const MAXVAL = 40;

function Triangle() {
	this.nv = 0;			/* number of polygon vertices */
	this.vindices = new Int32Array(MAXVAL);           /* array of triangle vertex indices */
	this.nindices = new Int32Array(MAXVAL);           /* array of triangle normal indices */
	this.tindices = new Int32Array(MAXVAL);           /* array of triangle texcoord indices*/
	this.findex = 0;                /* index of triangle facet normal */
} 

function FirstPass(model, data) {
	var  numvertices;        /* number of vertices in model */
	var  numnormals;         /* number of normals in model */
	var  numtexcoords;       /* number of texcoords in model */
	var  numtriangles;       /* number of triangles in model */
	/*var group = {            // current group
		name         : name,
		material     : 0,
		numtriangles : 0,
		triangles    : null,
	}*/
	var    v, n, t;
	var        buf = new Array(128);
	
	var lines =  data.split("\n");
	/* make a default group */
	var group = model.AddGroup("default");
	
//numvertices = numnormals = numtexcoords = 1;
	numvertices = 0;
	numnormals = 0;
	numtexcoords = 0;
	numtriangles = 0;
	
	for ( var i = 0 ; i < lines.length ; i++ ) {
	var buf = lines[i].trimRight().split(' ');
	if ( buf.length > 0 ) {
	switch(buf[0]) {
	case '#':               /* comment */
		/* eat up rest of line */
		//fgets(buf, sizeof(buf), file);
		break;
	case 'v':               /* v, vn, vt */
		numvertices++;
		break;
	case 'vn':               /* v, vn, vt */
		numnormals++;
		break;
	case 'vt':               /* v, vn, vt */
		numtexcoords++;
		break;

		/*switch(buf[1]) {
		case '\0':        

		fgets(buf, sizeof(buf), file);
		numvertices++;
		break;
		case 'n':        
	
		fgets(buf, sizeof(buf), file);
		numnormals++;
		break;
		case 't':       
		
		fgets(buf, sizeof(buf), file);
		numtexcoords++;
		break;
		default:
		console.log("FirstPass(): Unknown token ",buf,".");
		break;
		}
		break;*/
	case 'm':
		/* fgets(buf, sizeof(buf), file);
		sscanf(buf, "%s %s", buf, buf);
		model.mtllibname = strdup(buf);
		glmReadMTL(model, buf);*/
		;
		break;
	case 'u':
		/* eat up rest of line */
		//fgets(buf, sizeof(buf), file);
		;
		break;
	case 'g':               /* group */
		/* eat up rest of line */
		//fgets(buf, sizeof(buf), file);
		group = model.AddGroup(buf);
		break;
	case 'f':               /* face */
		/*v = 0;
		n = 0;
		t = 0;*/
			/*var f1 = buf[1].split('/');
			var f2 = buf[2].split('/');
			var f3 = buf[3].split('/');*/

	//	numtriangles++;
	//	group.numtriangles++;
		//if (buf.length > 4) {
			numtriangles++;
			group.numtriangles++;
			//var f4 = buf[4].split('/');
		//}
		break;			
		}
	}
}  
	/* set the stats in the model structure */
	model.numvertices  = numvertices;
	model.numnormals   = numnormals;
	model.numvcolors   = numvertices;
	model.numtexcoords = numtexcoords;
	model.numtriangles = numtriangles;
	

	/* allocate memory for the triangles in each group */
	//group = model.groups;
	//while(group) {
	for (var i=0; i<model.numgroups;i++) {
		model.groups[i].triangles = new Array(group.numtriangles); //(GLuint*)malloc(sizeof(GLuint) * group.numtriangles);
		model.groups[i].numtriangles = 0;
	}
}


function SecondPass(model, data, mesh) {
	var  numvertices;        /* number of vertices in model */
	var  numnormals;         /* number of normals in model */
	var  numtexcoords;       /* number of texcoords in model */
	var  numtriangles;       /* number of triangles in model */
	var    vertices;           /* array of vertices  */
	var    normals = [];            /* array of normals */
	var    texcoords = [];          /* array of texture coordinates */
	var group;            /* current group pointer */
	var  material;           /* current material */
	var  v, n, t;
	var        buf = new Array(128);
	var  i;
	
	
	/* set the pointer shortcuts */
	vertices   = model.vertices;
	normals    = model.normals;
	texcoords  = model.texcoords;
	group      = 0; //model.groups; /*  = 0 ????? */
	
	mesh.nvert = model.numvertices;
	mesh.nface = model.numtriangles;
	mesh.ntexc = model.texcoords;

	/* on the second pass through the file, read all the data into the
	allocated arrays */
//numvertices = numnormals = numtexcoords = 1;
	numvertices = 1;
	numnormals = 0;
	numtexcoords = 0;
	numtriangles = 0;
	material = 0;

	mesh.vert  = new Array(mesh.nvert+1);
	for (var h = 0; h<mesh.nvert+1; h++) 
	mesh.vert[h] = new nvr();

	mesh.face = new Array(mesh.nface+2);
	for (var h = 0; h<mesh.nface+1; h++)
	{
		mesh.face[h]=new nfc();
		mesh.face[h].norm = new Array();
		mesh.face[h].tcor = new Array();
	}
	

	var lines = data.split("\n");
	for (j=0; j<lines.length; j++) {
	var buf = lines[j].trimRight().split(' ');
	switch(buf[0]) {
	case '#':               /* comment */
		/* eat up rest of line */
		//fgets(buf, sizeof(buf), file);
		;
		break;
	case 'v':               /* v, vn, vt */
		//vertices.push(parseFloat(buf[1]),parseFloat(buf[2]),parseFloat(buf[3]));
		vertices[3 * numvertices + 0] = parseFloat(buf[1]); 
		vertices[3 * numvertices + 1] = parseFloat(buf[2]);
		vertices[3 * numvertices + 2] = parseFloat(buf[3]);


		mesh.vert[numvertices].x=parseFloat(buf[1]); 
		mesh.vert[numvertices].y=parseFloat(buf[2]); 
		mesh.vert[numvertices].z=parseFloat(buf[3]); 
//         console.log(1,numvertices);
		numvertices++;
		break;		
	case 'vn':               /* v, vn, vt */
		//normals.push(parseFloat(buf[1]),parseFloat(buf[2]),parseFloat(buf[3]));
		normals[3 * numnormals + 0] = parseFloat(buf[1]);
		normals[3 * numnormals + 1] = parseFloat(buf[2]);
		normals[3 * numnormals + 2] = parseFloat(buf[3]);
		numnormals++;

		break;		
	case 'vt':               /* v, vn, vt */
		//texcoords.push(parseFloat(buf[1],buf[2]));
		texcoords[2 * numtexcoords + 0] = parseFloat(buf[1]);
		texcoords[2 * numtexcoords + 1] = parseFloat(buf[2]);
		
		numtexcoords++;

		break;		
	case 'u':
			material = model.FindMaterial(buf);
		group.material = material;
		break;
	case 'g':               /* group */
		/* eat up rest of line */
		//fgets(buf, sizeof(buf), file);

		group = model.FindGroup(buf);
		group.material = material;
		break;
	case 'f':               /* face */
		var f1 = buf[1].split('/');
		var f2 = buf[2].split('/');
		var f3 = buf[3].split('/');
		var f4 = null;
		if (buf.length>4)
		f4 = buf[4].split('/');
	
		model.triangles[numtriangles].vindices[0] = parseFloat(f1[0]);// - 1;
			if (f1[1])
		model.triangles[numtriangles].tindices[0] = parseFloat(f1[1]);// - 1;
			if (f1[2])
		model.triangles[numtriangles].nindices[0] = parseFloat(f1[2]);// - 1;

			model.triangles[numtriangles].vindices[1] = parseFloat(f2[0]);// - 1;
			if (f2[1])
		model.triangles[numtriangles].tindices[1] = parseFloat(f2[1]);// - 1;
			if (f2[2])
		model.triangles[numtriangles].nindices[1] = parseFloat(f2[2]);// - 1;

			model.triangles[numtriangles].vindices[2] = parseFloat(f3[0]);// - 1;
			if (f3[1])
		model.triangles[numtriangles].tindices[2] = parseFloat(f3[1]);// - 1;
			if (f3[2])
		model.triangles[numtriangles].nindices[2] = parseFloat(f3[2]);// - 1;
		model.triangles[numtriangles].nv = 3;			

		if (f4 != null) {
			//if (numtriangles==0) numtriangles++;
			/*model.triangles[numtriangles].vindices[0] = model.triangles[numtriangles-1].vindices[0];
			model.triangles[numtriangles].tindices[0] = model.triangles[numtriangles-1].tindices[0];
			model.triangles[numtriangles].nindices[0] = model.triangles[numtriangles-1].nindices[0];
			model.triangles[numtriangles].vindices[1] = model.triangles[numtriangles-1].vindices[2];
			model.triangles[numtriangles].tindices[1] = model.triangles[numtriangles-1].tindices[2];
			model.triangles[numtriangles].nindices[1] = model.triangles[numtriangles-1].nindices[2];*/
			model.triangles[numtriangles].vindices[3] = parseFloat(f4[0]);// - 1;
			model.triangles[numtriangles].tindices[3] = parseFloat(f4[1]);// - 1;
			model.triangles[numtriangles].nindices[3] = parseFloat(f4[2]);// - 1;
			//  model.groups[group].triangles[model.groups[group].numtriangles++] = numtriangles;
		//	if (numtriangles>1) numtriangles++;
			//numtriangles++;
			model.triangles[numtriangles].nv = 4;
		}
//			model.triangles[numtriangles].nv = 4;//buf.length - 1;
		model.groups[group].triangles[model.groups[group].numtriangles++] = numtriangles;
		numtriangles++;
		mesh.face[numtriangles].n_v_e=model.triangles[numtriangles-1].nv;
		for (var jj=0; jj<mesh.face[numtriangles].n_v_e; jj++)
		{
		mesh.face[numtriangles].vert[jj]=model.triangles[numtriangles-1].vindices[jj];
		mesh.face[numtriangles].norm[jj]=model.triangles[numtriangles-1].nindices[jj]; //AGGIUNTA per indici normali
		if(mesh.face[numtriangles].tcor != undefined)
			mesh.face[numtriangles].tcor[jj]=model.triangles[numtriangles-1].tindices[jj]; //AGGIUNTA per coordinate texture
	}
//	      console.log(2,mesh.face[numtriangles].n_v_e);

		break;
		}
	}
	
	// colore dei vertici
	for (i=1; i<=model.numvcolors; i++)
	{
		model.vcolors[3 * i + 0]=1.0;
		model.vcolors[3 * i + 1]=1.0;
		model.vcolors[3 * i + 2]=1.0;
	}
	mesh.texCoord = texcoords; //Restituisco anche le coordinate texture
	mesh.normals = normals; //Restituisco anche le normali 
	return mesh;
}


function ReadOBJ(data,mesh) {
	/* allocate a new model */
	/*var model = { 
		//pathname      : strdup(filename);
		mtllibname    : null,
		numvertices   : 0,
		vertices      : null,
		numnormals    : 0,
		normals       : null,
		numvcolors    : 0,
		vcolors       : null,
		numtexcoords  : 0,
		texcoords     : null,
		numfacetnorms : 0,
		facetnorms    : null,
		numtriangles  : 0,
		triangles     : null,
		nummaterials  : 0,
		materials     : null,
		numgroups     : 0,
		groups        : null,
		position      : [0.0, 0.0, 0.0]
	}*/
	var model = new Model();

	/* make a first pass through the file to get a count of the number
	of vertices, normals, texcoords & triangles */
	FirstPass(model, data);
	/* allocate memory */
	model.vertices =  new Float64Array(3 * (model.numvertices + 1));
	//model.triangles = new Array(model.numtriangles);
	//for (var i = 0; i<model.numtriangles+1; i++) {
	for (var i = 0; i<model.numtriangles; i++) {
		var triangle = {
			nv : 0,			/* number of polygon vertices */
			vindices : new Int32Array(MAXVAL),           /* array of triangle vertex indices */
			nindices : new Int32Array(MAXVAL),           /* array of triangle normal indices */
			tindices : new Int32Array(MAXVAL),           /* array of triangle texcoord indices*/
			findex : 0,                /* index of triangle facet normal */ 
		}
	model.triangles.push(triangle);
		triangle=null;
		}
	if (model.numnormals) {
	model.normals = new Float64Array( 3 * (model.numnormals + 1));
	}
	if (model.numtexcoords) {
	model.texcoords = new Float64Array( 2 * (model.numtexcoords + 1));
	}
	if (model.numvcolors) {
	model.vcolors = new Float64Array( 3 * (model.numvcolors + 1));
	}
	
	/* rewind to beginning of file and read in the data this pass */
	//rewind(file);
	
	mesh = SecondPass(model, data, mesh);
	
	/* close the file */
	return mesh;
}

