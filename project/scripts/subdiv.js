//****************subdiv************************************************/
//const DEG = 10;

function nev(poly_data, vertex_patches, gregory_patches) {
  this.n_svert = null;
  this.s_vertex = null;        // indici dei vertici straordinari (EV)
  this.s_vertex_val = null;    // valenze dei vertici straordinari (EV)
  this.s_face = null;          // per ogni EV (riga), indici delle facce che lo contengono (a giro)
  this.s_gc = 0;            // per ogni EV (riga), indice gc del sotto-patch che lo contiene
  this.s_ring = null;          // per ogni EV (riga), coordinate x,y,z (a gruppi di 3) dei 6n+1 vertici del 2-ring
  this.poly_data = null;  // polinomi di approssimazione ai minimi quadrati
  this.vertex_patches = null;   // control points del settore 1 per il domain mapping (ui,vi).(u,v)
  this.gregory_patches = null; // Gregory patches*/
  /*int *s_vertex;       // indici dei vertici straordinari (EV)
  int *s_vertex_val;   // valenze dei vertici straordinari (EV)
  int **s_face;        // per ogni EV (riga), indici delle facce che lo contengono (a giro)
  int **s_gc;          // per ogni EV (riga), indice gc del sotto-patch che lo contiene
  double **s_ring;     // per ogni EV (riga), coordinate x,y,z (a gruppi di 3) dei 6n+1 vertici del 2-ring
  ls_poly *poly_data;  // polinomi di approssimazione ai minimi quadrati
  //overlap_patch **overlap_patches; // overlap patches
  bezier_patch **vertex_patches;   // control points del settore 1 per il domain mapping (ui,vi).(u,v)
  gregory_patch **gregory_patches; // Gregory patches*/
};


//function Subdiv_data(vertices, di_par, ei_par, gregory_patch) {
function Subdiv_data() {
  this.shared_grid = new Grid_data(); // puntatore alla grid_data comune
  this.np = null;                 // numero di patch associati ad una faccia quadrilatera (1 o 4)
  this.b_flip_face = new Int32Array(4);     // informazione per la valutazione di patch con EV (valenza >3) sul bordo
                          // se !=0 il patch e' di bordo
  this.N = new Int32Array(4);               // valenza del patch o meglio dell'eventuale vertice straordinario del patch
  this.vertices = new Array(4);    // array di puntatori alla lista di CP del patch
  this.di_par = [];      // array di puntatori alla lista dei 12 parametri d_i del patch
  this.ei_par = [];      // array di puntatori alla lista dei 12 parametri e_i del patch
 /* double *vertices[4];    // array di puntatori alla lista di CP del patch
  double *di_par[4];      // array di puntatori alla lista dei 12 parametri d_i del patch
  double *ei_par[4];      // array di puntatori alla lista dei 12 parametri e_i del patch
*/
//  gcPOINT limit_point[4]; // punto del patch in corrispondenza del parametro (0,0)
//  gcPOINT limit_du[4];    // derivata du del patch in corrispondenza del parametro (0,0)
//  gcPOINT limit_dv[4];    // derivata dv del patch in corrispondenza del parametro (0,0)
  this.subdiv_type = null;          // tipo di classe di suddivisione: Catmull-Clark=1
  this.fnum = null;
//  int ev[4];             // indici per il recupero del polinomio corrispondente dall'array di ls_poly
  //ls_poly *poly_data[4];    // array di puntatori alla lista di polinomi per blending relativi al patch
 // overlap_patch *overlap_data[4]; // array di puntatori alla lista di overlap patches relativi al patch
  this.gregory_data = [];  //gregory_patch; // array di puntatori alla lista di Gregory patches relativi al patch
  this.sector = new Int32Array(4);            // settore della mappa caratteristica
};

function nvr() {
  this.x = 0;
  this.y = 0;
  this.z = 0;   // x, y e z vengono letti
  this.n_neigh = 0;      // numero di vertici del primo ring
  this.neigh = new Int32Array(MAXVAL);
  this.edge = new Int32Array(MAXVAL);
  this.face = new Int32Array(MAXVAL);
  this.val = 0;          // valenza del vertice
  this.bound = null;        // flag se e' di bordo
  this.vind = 0;     // se il vertice e' straordinario, e' l'indice del vertice nella lista dei vertici straordinari
} ;

function ndg() {
  this.neigh = new Int32Array(2);
  this.vert = new Int32Array(2); 
  this.val = 0;                     // indica la valenza del lato; se di bordo o meno
};

function nfc() {
  this.n_v_e=0;                   // numero vertici o lati; viene letto
  this.neigh = new Int32Array(MAXVAL);
  this.edge = new Int32Array(MAXVAL);
  this.vert = new Int32Array(MAXVAL);   // vert; viene letto
  this.val=0;                     // valenza della face; numero di facce del primo ring
  this.bound=null;                   // flag se e' di bordo
  this.find=null;                // se la faccia non e' quadrilatera, e' uguale al numero di vertici straordinari nella mesh originale +
                               // indice della faccia nella lista delle facce non quadrilatere
};

//function subd_mesh(vert,edge,face) {
function subd_mesh() {
  this.nvert = 0;           /* num. of vertices */
  this.nedge = 0;           /* num. of edges */
  this.nface = 0;           /* num. of faces */
  this.vert = [];           /* mesh vertices [1..nvert] */
  this.edge = [];           /* mesh edges [1..nedge] */
  this.face = [];           /* mesh faces[1..nface] */
} ;

function Grid_data() {      // mesh (grid) data
   this.npolygons;  // numero di poligoni
   this.firstv;    // per ogni poligono indice del primo vertice nel vettore dei nodi
                        // il numero di vertici per poligono e~R determinato da firstv[i+1] ~V firstv[i];
                        // la lunghezza di firstv e' npolygons + 1.
                        // firstv[0] = 0
                        // firstv[npolygons] = lunghezza del vettore node_index.
                        // node_index[firstv[i]] .. node_index[firstv[i+1]-1] sono i nodi del poligono i
                        // i sta nell'intervallo [0 .. npolygons-1]
   this.node_index = [];// per ogni vertice indice nel vettore dei nodi

   this.nnodes;     // numero di nodi
   //coord<3> *nodes;     // coordinate di ciascun nodo (possono essere condivisi) 
   this.nodes = [new Float64Array(3)];
};

function work_area() {
  this.n = 0;
  this.vedge = [];
  this.epos = [];
  this.f1pos = [];
  this.f2pos = [];
} ;


