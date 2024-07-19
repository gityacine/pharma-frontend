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
    const productMaterials = await productMaterialsRes.json();
    return { productsData };
}

export default function Calculator() {
    const { productsData } = useLoaderData();
    const [products, setProducts] = useState(productsData);
    const modalRef = useRef(null);

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
            modalRef.current.showModal();
        }
    }

    function closeModal() {
        if (modalRef.current) {
            modalRef.current.close();
        }
    }

    return (
        <>
            <h1>This is the Calculator route</h1>
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
            <dialog ref={modalRef}>
                <h2>Dialog Title</h2>
                <p>This is a dialog content.</p>
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