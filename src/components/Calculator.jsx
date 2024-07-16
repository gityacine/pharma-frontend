import { useState } from "react";
import { useLoaderData } from "react-router-dom";

export async function loader() {
    const [productsRes, materialsRes, productMaterialsRes] = await Promise.all([
        fetch('http://localhost:3000/api/products'),
        fetch('http://localhost:3000/api/materials'),
        fetch('http://localhost:3000/api/product-materials')
    ]);

    const productsData = await productsRes.json();
    productsData.forEach(product => {
        product.allocated = 0;
    });
    const materials = await materialsRes.json();
    const productMaterials = await productMaterialsRes.json();
    return { productsData };
}

export default function Calculator() {
    const { productsData } = useLoaderData();
    const [products, setProducts] = useState(productsData);

    function allocate(id) {
        const nextProducts = products.map(product => {
            if (product.id === id) {
                return {
                    ...product,
                    allocated: product.allocated + 1,
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
                    allocated: product.allocated - 1,
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
                    allocated: parseInt(value),
                };
            } else {
                return product;
            }
        });
        setProducts(nextProducts);
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
        if (e.key === "e" || e.key === "." || e.key === "-" || e.key === "+") {
            e.preventDefault();
        } else if (e.key === "Enter") {
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
        if (e.target.value === "") {
            setValue(0);
        } else {
            setValue(parseInt(e.target.value));
        }
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
                    type="number"
                    onKeyDown={onKeyPress}
                    value={value.toString()}
                    min={0}
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