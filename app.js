/* PLEA ASHES v4 — Supabase edition
   Replace SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY below with your project values.
*/
const SUPABASE_URL = (window.PLEA_ASHES_SUPABASE?.url || "https://euiadxlpqnvrbyxrzelp.supabase.co");
const SUPABASE_PUBLISHABLE_KEY = (window.PLEA_ASHES_SUPABASE?.publishableKey || "sb_publishable_LrIwp7KKrOy_ha_gDeHv8g_zGeTMCND");

if (!window.supabase || typeof window.supabase.createClient !== "function") {
  throw new Error("Supabase library gagal dimuat.");
}
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
window.PLEA_ASHES_DB = supabaseClient;
const db = supabaseClient;

const $ = (s) => document.querySelector(s);
const money = (n) => new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(Number(n)||0);

let products = [];
let cart = JSON.parse(localStorage.getItem("plea_ashes_cart") || "[]");
let currentSession = null;
let selectedImageFile = null;

function toast(msg){
  const el=$("#toast"); el.textContent=msg; el.classList.add("show");
  clearTimeout(window.__toast); window.__toast=setTimeout(()=>el.classList.remove("show"),2600);
}
function escapeHtml(v=""){
  return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
}
function placeholder(){
  return "data:image/svg+xml;charset=UTF-8,"+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="700" height="800"><rect width="100%" height="100%" fill="#e5e1da"/><text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-family="Arial" font-size="30" fill="#777">PLEA ASHES</text></svg>`);
}
function saveCart(){localStorage.setItem("plea_ashes_cart",JSON.stringify(cart));}
function updateCartCount(){ $("#cartCount").textContent=cart.reduce((s,i)=>s+i.qty,0); }

async function loadProducts(){
  $("#loadingState").classList.remove("hidden");
  const {data,error}=await db.from("products").select("*").order("created_at",{ascending:false});
  $("#loadingState").classList.add("hidden");
  if(error){ console.error("Supabase products error:", error); $("#productGrid").innerHTML=""; $("#emptyState").textContent=`Produk belum bisa dimuat: ${error.message || "Periksa koneksi Supabase."}`; $("#emptyState").classList.remove("hidden"); return; }
  products=data||[];
  renderCategories(); renderProducts(); renderAdmin();
}
function renderCategories(){
  const select=$("#categoryFilter"); const current=select.value;
  const cats=[...new Set(products.map(p=>p.category).filter(Boolean))].sort();
  select.innerHTML='<option value="all">All categories</option>'+cats.map(c=>`<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
  if(cats.includes(current)) select.value=current;
}
function filteredProducts(){
  const q=$("#search").value.trim().toLowerCase(), cat=$("#categoryFilter").value;
  return products.filter(p=>{
    const text=`${p.name||""} ${p.category||""} ${p.description||""}`.toLowerCase();
    return (!q||text.includes(q)) && (cat==="all"||p.category===cat);
  });
}
function renderProducts(){
  const list=filteredProducts(), grid=$("#productGrid"), empty=$("#emptyState");
  grid.innerHTML=list.map(p=>`
    <article class="product-card">
      <div class="product-image"><img src="${escapeHtml(p.image_url||placeholder())}" alt="${escapeHtml(p.name)}" onerror="this.src='${placeholder()}'"></div>
      <div class="product-info">
        <div class="product-meta"><span>${escapeHtml(p.category||"")}</span><span>${Number(p.stock)>0?"In stock":"Sold out"}</span></div>
        <h3>${escapeHtml(p.name)}</h3>
        <p>${escapeHtml(p.description||"")}</p>
        <strong>${money(p.price)}</strong>
        <button class="button dark product-buy" data-add="${escapeHtml(p.id)}" ${Number(p.stock)<=0?"disabled":""}>${Number(p.stock)>0?"Add to cart":"Sold out"}</button>
      </div>
    </article>`).join("");
  empty.classList.toggle("hidden",list.length>0);
}
function renderAdmin(){
  if(!currentSession) return;
  const q=$("#adminSearch").value.trim().toLowerCase();
  const list=products.filter(p=>`${p.name||""} ${p.category||""}`.toLowerCase().includes(q));
  $("#statProducts").textContent=products.length;
  $("#statStock").textContent=products.reduce((s,p)=>s+Number(p.stock||0),0);
  $("#statCategories").textContent=new Set(products.map(p=>p.category).filter(Boolean)).size;
  $("#adminTable").innerHTML=list.map(p=>`
    <tr>
      <td><div class="admin-product"><img src="${escapeHtml(p.image_url||placeholder())}" alt=""><div><strong>${escapeHtml(p.name)}</strong><small>${escapeHtml(p.description||"").slice(0,60)}</small></div></div></td>
      <td>${escapeHtml(p.category||"")}</td><td>${money(p.price)}</td><td>${Number(p.stock||0)}</td>
      <td><div class="actions"><button class="action-btn" data-edit="${escapeHtml(p.id)}">Edit</button><button class="action-btn delete" data-delete="${escapeHtml(p.id)}">Delete</button></div></td>
    </tr>`).join("");
}
function openLogin(){
  $("#loginError").textContent="";
  $("#loginPassword").value="";
  $("#loginDialog").showModal();
}
function openAdmin(){
  if(!currentSession){openLogin();return;}
  $("#adminEmail").textContent=currentSession.user.email||"";
  renderAdmin(); $("#adminDialog").showModal();
}
async function login(e){
  e.preventDefault(); $("#loginError").textContent="Logging in…"; $("#loginSubmit").disabled=true;
  const {data,error}=await db.auth.signInWithPassword({email:$("#loginEmail").value.trim(),password:$("#loginPassword").value});
  $("#loginSubmit").disabled=false;
  if(error){$("#loginError").textContent=error.message;return;}
  currentSession=data.session;
  $("#loginDialog").close(); $("#adminEmail").textContent=currentSession.user.email||"";
  $("#adminDialog").showModal(); toast("Login berhasil.");
}
async function signOut(){
  await db.auth.signOut(); currentSession=null; $("#adminDialog").close(); toast("Sudah logout.");
}
function resetForm(){
  $("#productForm").reset(); $("#productId").value=""; $("#oldImageUrl").value="";
  $("#formTitle").textContent="Add product"; $("#productImagePreview").src=placeholder();
  selectedImageFile=null; $("#productError").textContent="";
}
function openProductForm(p=null){
  resetForm();
  if(p){
    $("#formTitle").textContent="Edit product"; $("#productId").value=p.id; $("#oldImageUrl").value=p.image_url||"";
    $("#name").value=p.name||""; $("#price").value=p.price??0; $("#stock").value=p.stock??0;
    $("#category").value=p.category||""; $("#image").value=p.image_url||""; $("#description").value=p.description||"";
    $("#productImagePreview").src=p.image_url||placeholder();
  }
  $("#productDialog").showModal();
}
async function uploadImage(file){
  if(!file) return null;
  if(!file.type.startsWith("image/")) throw new Error("File harus berupa gambar.");
  if(file.size>5*1024*1024) throw new Error("Ukuran foto maksimal 5 MB.");
  const ext=(file.name.split(".").pop()||"jpg").toLowerCase().replace(/[^a-z0-9]/g,"")||"jpg";
  const path=`products/${crypto.randomUUID()}.${ext}`;
  const {error}=await db.storage.from("product-images").upload(path,file,{cacheControl:"3600",upsert:false});
  if(error) throw error;
  const {data}=db.storage.from("product-images").getPublicUrl(path);
  return data.publicUrl;
}
async function saveProduct(e){
  e.preventDefault();
  if(!currentSession){toast("Silakan login.");return;}
  const button=$("#saveProduct"); button.disabled=true; button.textContent="Saving…"; $("#productError").textContent="";
  try{
    let imageUrl=$("#image").value.trim();
    if(selectedImageFile) imageUrl=await uploadImage(selectedImageFile);
    const payload={
      name:$("#name").value.trim(), price:Number($("#price").value||0), stock:Number($("#stock").value||0),
      category:$("#category").value.trim(), image_url:imageUrl||null, description:$("#description").value.trim()
    };
    const id=$("#productId").value;
    const result=id ? await db.from("products").update(payload).eq("id",id).select().single()
                    : await db.from("products").insert(payload).select().single();
    if(result.error) throw result.error;
    $("#productDialog").close(); await loadProducts(); renderAdmin();
    toast(id?"Produk diperbarui.":"Produk ditambahkan.");
  }catch(err){console.error(err);$("#productError").textContent=err.message||"Gagal menyimpan produk.";}
  finally{button.disabled=false;button.textContent="Save product";}
}
async function deleteProduct(id){
  const p=products.find(x=>String(x.id)===String(id)); if(!p)return;
  if(!confirm(`Hapus "${p.name}"?`))return;
  const {error}=await db.from("products").delete().eq("id",id);
  if(error){toast("Gagal menghapus: "+error.message);return;}
  await loadProducts(); toast("Produk dihapus.");
}
function addToCart(id){
  const p=products.find(x=>String(x.id)===String(id)); if(!p||Number(p.stock)<=0)return;
  const item=cart.find(x=>String(x.id)===String(id));
  if(item){if(item.qty>=Number(p.stock)){toast("Stok tidak cukup.");return}item.qty++}
  else cart.push({id:p.id,qty:1});
  saveCart();updateCartCount();toast("Ditambahkan ke cart.");
}
function renderCart(){
  const rows=cart.map(i=>{const p=products.find(x=>String(x.id)===String(i.id));return p?{...p,qty:i.qty}:null}).filter(Boolean);
  if(rows.length===0){$("#cartItems").innerHTML='<div class="empty">Cart masih kosong.</div>';$("#cartTotal").textContent=money(0);return;}
  $("#cartItems").innerHTML=rows.map(p=>`<div class="cart-row"><img src="${escapeHtml(p.image_url||placeholder())}" alt=""><div class="cart-row-info"><strong>${escapeHtml(p.name)}</strong><small>${p.qty} × ${money(p.price)}</small></div><button data-remove-cart="${escapeHtml(p.id)}">Remove</button></div>`).join("");
  $("#cartTotal").textContent=money(rows.reduce((s,p)=>s+p.price*p.qty,0));
}
function removeCart(id){cart=cart.filter(i=>String(i.id)!==String(id));saveCart();updateCartCount();renderCart();}
function getCartRows(){
  return cart.map(i=>{const p=products.find(x=>String(x.id)===String(i.id));return p?{...p,qty:Number(i.qty)||1}:null}).filter(Boolean);
}
function openCheckout(){
  const rows=getCartRows();
  if(!rows.length){toast("Cart masih kosong.");return;}
  const total=rows.reduce((s,p)=>s+Number(p.price||0)*p.qty,0);
  $("#checkoutSummary").innerHTML=rows.map(p=>`<div class="checkout-line"><span>${escapeHtml(p.name)} × ${p.qty}</span><strong>${money(Number(p.price||0)*p.qty)}</strong></div>`).join("");
  $("#checkoutTotal").textContent=money(total);
  $("#checkoutError").textContent="";
  $("#checkoutDialog").showModal();
}
function makeOrderNumber(){
  const now=new Date();
  const stamp=now.toISOString().replace(/[-:TZ.]/g,"").slice(0,14);
  const rand=Math.floor(1000+Math.random()*9000);
  return `PA-${stamp}-${rand}`;
}
async function submitCheckout(e){
  e.preventDefault();
  const button=$("#placeOrderBtn"); button.disabled=true; button.textContent="Creating order…"; $("#checkoutError").textContent="";
  try{
    const rows=getCartRows();
    if(!rows.length) throw new Error("Cart masih kosong.");
    for(const p of rows){
      if(Number(p.stock)<=0) throw new Error(`${p.name} sudah habis.`);
      if(p.qty>Number(p.stock)) throw new Error(`Stok ${p.name} tidak cukup.`);
    }
    const customer={
      name:$("#customerName").value.trim(),
      email:$("#customerEmail").value.trim(),
      phone:$("#customerPhone").value.trim(),
      address:$("#customerAddress").value.trim(),
      note:$("#customerNote").value.trim()
    };
    const total=rows.reduce((s,p)=>s+Number(p.price||0)*p.qty,0);
    const orderNumber=makeOrderNumber();
    const items=rows.map(p=>({product_id:p.id,name:p.name,price:Number(p.price||0),qty:p.qty,image_url:p.image_url||null}));
    const {error}=await db.from("orders").insert({
      order_number:orderNumber, customer_name:customer.name, customer_email:customer.email,
      customer_phone:customer.phone, shipping_address:customer.address, note:customer.note||null,
      items, total_amount:total, status:"pending"
    });
    if(error) throw error;
    cart=[]; saveCart(); updateCartCount(); renderCart();
    $("#checkoutDialog").close(); $("#cartDialog").close();
    $("#successOrderNumber").textContent=orderNumber;
    $("#successDialog").showModal();
  }catch(err){console.error(err);$("#checkoutError").textContent=err.message||"Gagal membuat order.";}
  finally{button.disabled=false;button.textContent="Place order";}
}
function exportData(){
  const blob=new Blob([JSON.stringify(products,null,2)],{type:"application/json"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="plea-ashes-products.json";a.click();URL.revokeObjectURL(a.href);
}
async function importData(file){
  try{
    const data=JSON.parse(await file.text()); if(!Array.isArray(data))throw new Error("JSON harus berupa array produk.");
    for(const p of data){
      const payload={name:p.name||"Untitled",price:Number(p.price||0),stock:Number(p.stock||0),category:p.category||"General",image_url:p.image_url||null,description:p.description||""};
      const {error}=await db.from("products").insert(payload);if(error)throw error;
    }
    await loadProducts();toast("Import selesai.");
  }catch(e){toast("Import gagal: "+e.message);}
}

document.addEventListener("click",e=>{
  const add=e.target.closest("[data-add]"); if(add)addToCart(add.dataset.add);
  const edit=e.target.closest("[data-edit]"); if(edit){const p=products.find(x=>String(x.id)===String(edit.dataset.edit));if(p)openProductForm(p);}
  const del=e.target.closest("[data-delete]"); if(del)deleteProduct(del.dataset.delete);
  const rem=e.target.closest("[data-remove-cart]"); if(rem)removeCart(rem.dataset.removeCart);
});
$("#openAdmin").addEventListener("click",openAdmin);
$("#loginForm").addEventListener("submit",login);
$("#signOut").addEventListener("click",signOut);
$("#closeAdmin").addEventListener("click",()=>$("#adminDialog").close());
$("#addProduct").addEventListener("click",()=>openProductForm());
$("#productForm").addEventListener("submit",saveProduct);
$("#productImageFile").addEventListener("change",e=>{selectedImageFile=e.target.files[0]||null;if(selectedImageFile){$("#productImagePreview").src=URL.createObjectURL(selectedImageFile);$("#image").value="";}});
$("#image").addEventListener("input",e=>{if(e.target.value)$("#productImagePreview").src=e.target.value;});
$("#search").addEventListener("input",renderProducts);
$("#categoryFilter").addEventListener("change",renderProducts);
$("#adminSearch").addEventListener("input",renderAdmin);
$("#cartBtn").addEventListener("click",()=>{renderCart();$("#cartDialog").showModal();});
$("#closeCart").addEventListener("click",()=>$("#cartDialog").close());
$("#checkoutBtn").addEventListener("click",openCheckout);
$("#checkoutForm").addEventListener("submit",submitCheckout);
$("#closeCheckoutX").addEventListener("click",()=>$("#checkoutDialog").close());
$("#closeCheckoutCancel").addEventListener("click",()=>$("#checkoutDialog").close());
$("#closeSuccess").addEventListener("click",()=>$("#successDialog").close());
$("#exportData").addEventListener("click",exportData);
$("#importData").addEventListener("change",e=>{if(e.target.files[0])importData(e.target.files[0]);e.target.value="";});
async function boot(){
  updateCartCount();
  try {
    const {data,error}=await db.auth.getSession();
    if(error) console.warn("Supabase auth session:", error.message);
    currentSession=data?.session || null;
  } catch(err) {
    console.warn("Supabase auth init:", err);
  }
  await loadProducts();
}
db.auth.onAuthStateChange((_event,session)=>{currentSession=session; renderAdmin();});
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();
