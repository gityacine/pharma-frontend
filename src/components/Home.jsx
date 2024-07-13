import { useState, useEffect } from 'react'
import Controls from './Controls';

function getMaterialData(id, materials, property) {
    for (const material of materials) {
        if (material.id === id) {
            return material[property];
        }
    }
}

function getProductMaterials(id, productMaterials) {
    for (const product of productMaterials) {
        if (product.id === id) {
            return product.materials;
        }
    }
}

// this function should dynamically return the max number of Lots
// based on an array of coeffs and the current stock
// TODO: remember to take care of where max = null
function getMax(id, products, materials, allocated) {
    let max = null;
    const productMaterials = getProductMaterials(id, products);
    for (const productMaterial of productMaterials) {
        if (getMaterialData(productMaterial.id, materials, "class") === "A") {
            const newMax = getMaterialData(productMaterial.id, materials, "quantity") / productMaterial.coeff;
            if (max === null || newMax < max) {
                max = newMax;
            }
        }
    }
    return Math.trunc(max) + allocated;
}


export default function Home() {
    const [products, setProducts] = useState(null);
    const [materials, setMaterials] = useState(null);
    const [productMaterials, setProductMaterials] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [productsRes, materialsRes, productMaterialsRes] = await Promise.all([
                    fetch('http://localhost:3000/api/products'),
                    fetch('http://localhost:3000/api/materials'),
                    fetch('http://localhost:3000/api/product-materials')
                ]);
                if (!productsRes.ok || !materialsRes.ok || !productMaterialsRes.ok) {
                    throw new Error('Network response was not ok');
                }
                const products = await productsRes.json();
                const materials = await materialsRes.json();
                const productMaterials = await productMaterialsRes.json();
                products.forEach(product => {
                    product.allocated = 0;
                    product.max = getMax(product.id, productMaterials, materials, 0);
                });
                //console.log(productMaterials);
                setProducts(products);
                setMaterials(materials);
                setProductMaterials(productMaterials);
            } catch (error) {
                setError(error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    function allocate(id) {
        // we first increment the allocated property on appropriate product
        // in the products array and update that state,
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
        // and then we update the materials object i.e subtracting quantities
        // from those materials
        // step1: get the array of materials with coeffs of this product
        const coeffs = getProductMaterials(id, productMaterials);
        const nextMaterials = materials.map(material => {
            // if material exists in coeff, subtract coeff from its quantity
            for (const element of coeffs) {
                if (element.id === material.id) {
                    return {
                        ...material,
                        quantity: material.quantity - element.coeff,
                    };
                }
            }
            return material;
        });

        setProducts(nextProducts);
        setMaterials(nextMaterials);
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
        const coeffs = getProductMaterials(id, productMaterials);
        const nextMaterials = materials.map(material => {
            // if material exists in coeff, add coeff from its quantity
            for (const element of coeffs) {
                if (element.id === material.id) {
                    return {
                        ...material,
                        quantity: material.quantity + element.coeff,
                    };
                }
            }
            return material;
        });
        setProducts(nextProducts);
        setMaterials(nextMaterials);
    }

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error.message}</div>;

    return (
        <>
            <table>
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Old</th>
                        <th>New</th>
                        <th>Current</th>
                    </tr>
                </thead>
                <tbody>
                    {products.map((product) => (
                        <tr key={product.id}>
                            <td>{product.name}</td>
                            <td>{product.max}</td>
                            <td>{getMax(product.id, productMaterials, materials, product.allocated)}</td>
                            <td>
                                <Controls
                                    max={getMax(product.id, productMaterials, materials, product.allocated)}
                                    id={product.id}
                                    allocated={product.allocated}
                                    onAllocate={allocate}
                                    onDeallocate={deallocate} />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </>
    );
}