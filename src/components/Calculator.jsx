import { useState, useRef } from "react";
import { useLoaderData } from "react-router-dom";

export async function loader() {
    const [productsRes, materialsRes, productMaterialsRes] = await Promise.all([
        fetch('http://localhost:3000/api/products'),
        fetch('http://localhost:3000/api/materials'),
        fetch('http://localhost:3000/api/product-materials')
    ]);

    const productsData = await productsRes.json();
    productsData.forEach(product => {
        product.allocated = "0";
    });
    const materials = await materialsRes.json();
    const productMaterialsData = await productMaterialsRes.json();
    return { productsData, productMaterialsData, materials };
}

function getProductMaterials(id, productMaterials) {
    for (const element of productMaterials) {
        if (element.id === id) {
            return element.materials;
        }
    }
}

function getMaterialData(id, materials, property) {
    for (const material of materials) {
        if (material.id === id) {
            return material[property];
        }
    }
}

function getEntryIndex(entries, id) {
    for (let i = 0; i < entries.length; i++) {
        if (entries[i].id === id) {
            return i;
        }
    }
    return -1;
}

export default function Calculator() {
    const { productsData, productMaterialsData, materials } = useLoaderData();
    const [products, setProducts] = useState(productsData);
    const [entries, setEntries] = useState([]);
    const modalRef = useRef(null);
    const downloadButtonRef = useRef(null);
    const downloadApproButtonRef = useRef(null);
    const urlRef = useRef(null);

    function allocate(id) {
        const nextProducts = products.map(product => {
            if (product.id === id) {
                return {
                    ...product,
                    allocated: parseInt(product.allocated) + 1 + "",
                };
            } else {
                return product;
            }
        });
        setProducts(nextProducts);
    }

    function deallocate(id) {
        const nextProducts = products.map(product => {
            if (product.id === id) {
                return {
                    ...product,
                    allocated: parseInt(product.allocated) - 1 + "",
                };
            } else {
                return product;
            }
        });
        setProducts(nextProducts);
    }

    function handleChange(id, value) {
        const nextProducts = products.map(product => {
            if (product.id === id && value >= 0) {
                return {
                    ...product,
                    allocated: value,
                };
            } else {
                return product;
            }
        });
        setProducts(nextProducts);
    }

    function openModal() {
        if (modalRef.current) {
            const newEntries = [];
            for (const product of products) {
                if (parseInt(product.allocated) > 0) {
                    const productMaterials = getProductMaterials(product.id, productMaterialsData);
                    for (const productMaterial of productMaterials) {
                        const entry = {
                            id: productMaterial.id,
                            name: getMaterialData(productMaterial.id, materials, "name"),
                            stock: getMaterialData(productMaterial.id, materials, "quantity"),
                            quantity: parseInt(product.allocated) * productMaterial.coeff,
                        };
                        const index = getEntryIndex(newEntries, entry.id);
                        if (index === -1) {
                            newEntries.push(entry);
                        } else {
                            newEntries[index].quantity = newEntries[index].quantity + entry.quantity;
                        }
                    }
                }
            }
            let csvContent = newEntries.map(entry => {
                return `${entry.id},"${entry.name}",${entry.quantity},${entry.stock},${(entry.stock - entry.quantity) >= 0 ? "-" : (entry.quantity - entry.stock)}`
            }).join("\n");
            csvContent = "id,name,required,stock,difference\n" + csvContent;

            let csvAppro = newEntries.filter(entry => {
                return entry.quantity > entry.stock;
            }).map(entry => {
                return `${entry.id},"${entry.name}",${entry.quantity},${entry.stock},${(entry.stock - entry.quantity) >= 0 ? "-" : (entry.quantity - entry.stock)}`
            }).join("\n");
            csvAppro = "id,name,required,stock,difference\n" + csvAppro;

            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);

            const blobAppro = new Blob([csvAppro], { type: "text/csv;charset=utf-8;" });
            const urlAppro = URL.createObjectURL(blobAppro);

            urlRef.current = url;
            if (downloadButtonRef.current) {
                downloadButtonRef.current.href = url;
                downloadButtonRef.current.download = "data.csv";
            }

            if (downloadApproButtonRef.current) {
                downloadApproButtonRef.current.href = urlAppro;
                downloadApproButtonRef.current.download = "data-appro.csv";
            }

            setEntries(newEntries);
            modalRef.current.showModal();
        }
    }

    function closeModal() {
        if (modalRef.current && urlRef.current) {
            URL.revokeObjectURL(urlRef.current)
            modalRef.current.close();
        }
    }

    return (
        <>
            <h1>Calculator</h1>
            <table>
                <thead>
                    <tr>
                        <th>Product Name</th>
                        <th>Quantity in Stock</th>
                    </tr>
                </thead>
                <tbody>
                    {products.map((product) => (
                        <tr key={product.id}>
                            <td>{product.name}</td>
                            <td>-</td>
                            <td>
                                <AdvancedControls
                                    id={product.id}
                                    key={product.allocated}
                                    allocated={product.allocated}
                                    onAllocate={allocate}
                                    onDeallocate={deallocate}
                                    onChange={handleChange}
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <button
                onClick={openModal}
            >Calculate</button>
            <dialog ref={modalRef} onClose={() => { console.log("dialog closed"); }}>
                <h2>Output</h2>
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Required</th>
                            <th>Stock</th>
                            <th>Difference</th>
                        </tr>
                    </thead>
                    <tbody>
                        {entries.map((entry) => (
                            <tr key={entry.id}>
                                <td>{entry.id}</td>
                                <td>{entry.name}</td>
                                <td>{entry.quantity}</td>
                                <td>{entry.stock}</td>
                                <td>{(entry.stock - entry.quantity) >= 0 ? "-" : (entry.quantity - entry.stock)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <a ref={downloadButtonRef} href="">Download as CSV</a>
                <a ref={downloadApproButtonRef} href="">Download CSV Appro</a>
                <button
                    onClick={closeModal}
                >Close</button>
            </dialog>
        </>
    );
}

function AdvancedControls({ id, allocated, onAllocate, onDeallocate, onChange }) {
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(allocated);

    function toggleEdit() {
        setIsEditing(true);
    }

    function onKeyPress(e) {
        if (e.key === "Enter") {
            onChange(id, value);
            setIsEditing(false);
        }
    }

    function handleBlur() {
        onChange(id, value);
        setIsEditing(false);
    }

    function selectInput(e) {
        e.target.select();
    }

    function handleChange(e) {
        let newValue = e.target.value;
        newValue = newValue.replace(/\D/g, '');
        newValue = newValue.replace(/^0+/, '');
        if (newValue === "") {
            newValue = "0";
        }
        setValue(newValue);
    }

    return (
        <div>
            <button
                onClick={() => {
                    if (allocated > 0) {
                        onDeallocate(id);
                    }
                }}
            >-</button>
            {isEditing ? (
                <input
                    onKeyDown={onKeyPress}
                    inputMode="numeric"
                    pattern="[0-9]"
                    value={value}
                    onChange={handleChange}
                    onFocus={selectInput}
                    autoFocus={true}
                    onBlur={handleBlur}
                />
            ) : (
                <span onClick={toggleEdit}>
                    {allocated}
                </span>
            )}
            <button
                onClick={() => {
                    onAllocate(id);
                }}
            >+</button>
        </div>
    );
}