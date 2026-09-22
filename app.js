const KEY="plea_ashes_v4_products";
const defaultProducts=[
 {id:"p1",name:"Ash Core Tee",price:289000,stock:18,category:"T-Shirts",image:"https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=85",description:"Heavyweight cotton tee with a quiet front mark."},
 {id:"p2",name:"Burnline Overshirt",price:749000,stock:9,category:"Outerwear",image:"https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=900&q=85",description:"Structured overshirt with a relaxed silhouette."},
 {id:"p3",name:"Aftermath Cap",price:259000,stock:24,category:"Accessories",image:"https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=900&q=85",description:"Six-panel cap finished with understated embroidery."},
 {id:"p4",name:"Coal Wide Trousers",price:689000,stock:7,category:"Bottoms",image:"https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=85",description:"Wide-leg trousers with a clean, utilitarian line."},
 {id:"p5",name:"Smoke Zip Hoodie",price:799000,stock:11,category:"Sweats",image:"https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=85",description:"Brushed fleece hoodie with oversized proportions."},
 {id:"p6",name:"Residue Tote",price:219000,stock:31,category:"Accessories",image:"https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=900&q=85",description:"Everyday canvas carryall with internal pocket."}
];
let products=loadProducts(), cart=JSON.parse(localStorage.getItem("plea_ashes_v4_cart")||"[]");

const $=s=>document.querySelector(s);
const money=n=>new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(n);

function handleProductImageUpload(file, previewId, urlInputId) {
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    alert("File harus berupa gambar.");
    return;
  }
  const maxMB = 3;
  if (file.size > maxMB * 1024 * 1024) {
    alert(`Ukuran foto maksimal ${maxMB} MB.`);
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    const result = reader.result;
    const preview = document.getElementById(previewId);
    const urlInput = document.getElementById(urlInputId);
    if (urlInput) urlInput.value = result;
    if (preview) {
      preview.src = result;
      preview.style.display = "block";
    }
  };
  reader.readAsDataURL(file);
}

function loadProducts(){try{const x=JSON.parse(localStorage.getItem(KEY));return Array.isArray(x)?x:structuredClone(defaultProducts)}catch{return structuredClone(defaultProducts)}}
function saveProducts(){localStorage.setItem(KEY,JSON.stringify(products));}
function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");clearTimeout(window._toast);window._toast=setTimeout(()=>t.classList.remove("show"),2200)}
function imageFallback(img){img.onerror=()=>{img.src="data:image/svg+xml;charset=UTF-8,"+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000"><rect width="100%" height="100%" fill="#ddd"/><text x="50%" y="50%" text-anchor="middle" font-family="Arial" font-size="28" fill="#777">PLEA ASHES</text></svg>`)}}

function renderCategories(){
 const cats=[...new Set(products.map(p=>p.category))].sort();
 const select=$("#categoryFilter"); const current=select.value;
 select.innerHTML='<option value="all">All categories</option>'+cats.map(c=>`<option>${escapeHtml(c)}</option>`).join("");
 if(cats.includes(current)) select.value=current;
}
function filteredProducts(){
 const q=$("#search").value.trim().toLowerCase(), cat=$("#categoryFilter").value;
 return products.filter(p=>(!q||`${p.name} ${p.category} ${p.description}`.toLowerCase().includes(q))&&(cat==="all"||p.category===cat));
}
function renderShop(){
 const grid=$("#productGrid"), list=filteredProducts();
 grid.innerHTML=list.map(p=>`<article class="product-card">
  <div class="product-image"><img src="${escapeAttr(p.image)}" alt="${escapeAttr(p.name)}" onload="imageFallback(this)" onerror="imageFallback(this)"></div>
  <div class="product-info"><div><h3>${escapeHtml(p.name)}</h3><p>${escapeHtml(p.category)}</p><p class="stock ${p.stock===0?"out":""}">${p.stock===0?"Out of stock":`${p.stock} in stock`}</p></div><span class="price">${money(p.price)}</span></div>
  <button class="button dark full" ${p.stock===0?"disabled":""} onclick="addToCart('${p.id}')">${p.stock===0?"Sold out":"Add to cart"}</button>
 </article>`).join("");
 $("#emptyState").classList.toggle("hidden",list.length>0);
}
function renderAdmin(){
 const q=$("#adminSearch").value.trim().toLowerCase();
 const list=products.filter(p=>`${p.name} ${p.category}`.toLowerCase().includes(q));
 $("#adminTable").innerHTML=list.map(p=>`<tr><td><strong>${escapeHtml(p.name)}</strong></td><td>${escapeHtml(p.category)}</td><td>${money(p.price)}</td><td>${p.stock}</td><td><div class="actions"><button class="mini" onclick="editProduct('${p.id}')">Edit</button><button class="mini delete" onclick="deleteProduct('${p.id}')">Delete</button></div></td></tr>`).join("");
 $("#statProducts").textContent=products.length;
 $("#statStock").textContent=products.reduce((a,p)=>a+Number(p.stock||0),0);
 $("#statCategories").textContent=new Set(products.map(p=>p.category)).size;
}
function refresh(){renderCategories();renderShop();renderAdmin();renderCart();}

function openProductForm(p=null){
 $("#productForm").reset(); $("#productId").value=p?.id||"";
 $("#formTitle").textContent=p?"Edit product":"Add product";
 if(p){$("#name").value=p.name;$("#price").value=p.price;$("#stock").value=p.stock;$("#category").value=p.category;$("#image").value=p.image;$("#description").value=p.description||""}
 $("#productDialog").showModal();
}
$("#productForm").addEventListener("submit",e=>{
 e.preventDefault();
 const id=$("#productId").value||"p"+Date.now();
 const data={id,name:$("#name").value.trim(),price:Number($("#price").value),stock:Number($("#stock").value),category:$("#category").value.trim(),image:$("#image").value.trim(),description:$("#description").value.trim()};
 const i=products.findIndex(p=>p.id===id); if(i>=0) products[i]=data; else products.unshift(data);
 saveProducts(); $("#productDialog").close(); refresh(); toast(i>=0?"Product updated":"Product added");
});
function editProduct(id){openProductForm(products.find(p=>p.id===id))}
function deleteProduct(id){const p=products.find(x=>x.id===id);if(!p)return;if(confirm(`Delete "${p.name}"?`)){products=products.filter(x=>x.id!==id);saveProducts();cart=cart.filter(x=>x.id!==id);saveCart();refresh();toast("Product deleted")}}
$("#resetData").onclick=()=>{if(confirm("Reset all products to the demo catalog?")){products=structuredClone(defaultProducts);saveProducts();refresh();toast("Demo data restored")}};
$("#addProduct").onclick=()=>openProductForm();
$("#adminSearch").oninput=renderAdmin;
$("#openAdmin").onclick=()=>{$("#adminDialog").showModal();renderAdmin()};
$("#closeAdmin").onclick=()=>$("#adminDialog").close();

function addToCart(id){const p=products.find(x=>x.id===id);if(!p||p.stock<1)return;const row=cart.find(x=>x.id===id);if(row){if(row.qty<p.stock)row.qty++}else cart.push({id,qty:1});saveCart();renderCart();toast("Added to cart")}
function saveCart(){localStorage.setItem("plea_ashes_v4_cart",JSON.stringify(cart))}
function renderCart(){
 $("#cartCount").textContent=cart.reduce((a,x)=>a+x.qty,0);
 $("#cartItems").innerHTML=cart.length?cart.map(row=>{const p=products.find(x=>x.id===row.id);return p?`<div class="cart-row"><img src="${escapeAttr(p.image)}" alt=""><div><h4>${escapeHtml(p.name)}</h4><p>${row.qty} × ${money(p.price)}</p></div><button onclick="removeCart('${p.id}')">×</button></div>`:""}).join(""):`<p style="color:#777">Your cart is empty.</p>`;
 $("#cartTotal").textContent=money(cart.reduce((a,row)=>{const p=products.find(x=>x.id===row.id);return a+(p?p.price*row.qty:0)},0));
}
function removeCart(id){cart=cart.filter(x=>x.id!==id);saveCart();renderCart()}
$("#cartBtn").onclick=()=>$("#cartDialog").showModal();
$("#closeCart").onclick=()=>$("#cartDialog").close();
$("#checkoutBtn").onclick=()=>{if(!cart.length)return toast("Your cart is empty");toast("Demo checkout — connect your payment flow here.")};

$("#search").oninput=renderShop; $("#categoryFilter").onchange=renderShop;
$("#exportData").onclick=()=>{const blob=new Blob([JSON.stringify(products,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="plea-ashes-products.json";a.click();URL.revokeObjectURL(a.href)};
$("#importData").onchange=e=>{const file=e.target.files[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{try{const data=JSON.parse(reader.result);if(!Array.isArray(data))throw 0;products=data.map((p,i)=>({...p,id:p.id||"imported-"+i}));saveProducts();refresh();toast("Products imported")}catch{toast("Invalid JSON file")}};reader.readAsText(file);e.target.value=""};

function escapeHtml(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function escapeAttr(s){return escapeHtml(s)}
refresh();

document.addEventListener("change", (event) => {
  if (event.target && event.target.id === "productImageFile") {
    handleProductImageUpload(
      event.target.files[0],
      "productImagePreview",
      "productImageUrl"
    );
  }
});

document.addEventListener("change", (event) => {
  if (!event.target || event.target.id !== "productImageFile") return;
  const file = event.target.files[0];
  if (!file) return;

  const candidates = [
    document.getElementById("productImageUrl"),
    document.querySelector('input[name="imageUrl"]'),
    document.querySelector('input[name="image_url"]'),
    document.querySelector('input[type="url"][placeholder*="image" i]'),
    document.querySelector('input[type="text"][placeholder*="image" i]')
  ].filter(Boolean);

  const urlInput = candidates[0];
  const preview = document.getElementById("productImagePreview");

  if (!file.type.startsWith("image/")) {
    alert("File harus berupa gambar.");
    event.target.value = "";
    return;
  }
  if (file.size > 3 * 1024 * 1024) {
    alert("Ukuran foto maksimal 3 MB.");
    event.target.value = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    if (urlInput) urlInput.value = reader.result;
    if (preview) {
      preview.src = reader.result;
      preview.style.display = "block";
    }
  };
  reader.readAsDataURL(file);
});
