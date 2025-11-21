
// src/Components/GroceriesAppContainer.jsx
import { useState, useEffect } from "react";
import CartContainer from "./CartContainer";
import axios from "axios";
import ProductsContainer from "./ProductsContainer";
import NavBar from "./NavBar";
import { useForm } from "react-hook-form";

export default function GroceriesAppContainer({ products: initialProducts }) {
  // products from backend / props
  const [products, setProducts] = useState(initialProducts || []);

  // quantity per product (by id)
  const [productQuantity, setProductQuantity] = useState(
    (initialProducts || []).map((product) => ({ id: product.id, quantity: 0 }))
  );

  // cart list is an ARRAY of products, not a single object
  const [cartList, setCartList] = useState([]);

  // form data for add/edit product
  const [formData, setFormData] = useState({
    id: "",
    productName: "",
    brand: "",
    image: "",
    price: "",
  });

  const [postResponse, setPostResponse] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // useEffect to fetch products from backend on mount
  useEffect(() => {
    handleConnectDB();
  }, []);

  // whenever products change, (re)build quantity array
  useEffect(() => {
    setProductQuantity(
      products.map((product) => ({ id: product.id, quantity: 0 }))
    );
  }, [products]);

  // react-hook-form handlers (you can use these in your <form>)
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  /////////////////////
  /* Handlers: fetching data from db */
  const handleConnectDB = async () => {
    try {
      const response = await axios.get("http://localhost:3000/products");
      setProducts(response.data);
    } catch (error) {
      console.error("Error fetching products from backend:", error);
    }
  };

  // handling form input change
  const handleOnChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // handling form submission (add / update)
  const handleOnSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        // Update existing product
        await handleUpdate(formData._id);
        setIsEditing(false);
        setFormData({
          id: "",
          productName: "",
          brand: "",
          image: "",
          price: "",
        });
      } else {
        // Create new product
        const response = await axios.post(
          "http://localhost:3000/products",
          formData
        );
        setPostResponse(
          response.data.message || "Product added successfully!"
        );
        setFormData({
          id: "",
          productName: "",
          brand: "",
          image: "",
          price: "",
        });
      }

      // refresh product list from DB after submit
      await handleConnectDB();
    } catch (error) {
      console.error("Error submitting form:", error);
      setPostResponse("Error submitting form. Please try again.");
    }
  };

  // handle edit product
  const handleEdit = (product) => {
    setIsEditing(true);
    setFormData({
      _id: product._id,
      id: product.id,
      productName: product.productName,
      brand: product.brand,
      image: product.image,
      price: product.price,
    });
  };

  // handle update product
  const handleUpdate = async (id) => {
    try {
      // your backend uses PATCH /products/:id
      const response = await axios.patch(
        `http://localhost:3000/products/${id}`,
        formData
      );
      setPostResponse(
        response.data.message || "Product updated successfully!"
      );
      await handleConnectDB();
    } catch (error) {
      console.log(error.message);
      setPostResponse("Error updating product. Please try again.");
    }
  };

  // handle delete product
  const handleDelete = async (id) => {
    try {
      const response = await axios.delete(
        `http://localhost:3000/products/${id}`
      );
      setPostResponse(
        response.data.message || "Product deleted successfully!"
      );
      await handleConnectDB();
    } catch (error) {
      console.log(error.message);
      setPostResponse("Error deleting product. Please try again.");
    }
  };

  // add quantity (cart or product list)
  const handleAddQuantity = (productId, mode) => {
    if (mode === "cart") {
      const newCartList = cartList.map((product) => {
        if (product.id === productId) {
          return { ...product, quantity: product.quantity + 1 };
        }
        return product;
      });
      setCartList(newCartList);
      return;
    } else if (mode === "product") {
      const newProductQuantity = productQuantity.map((product) => {
        if (product.id === productId) {
          return { ...product, quantity: product.quantity + 1 };
        }
        return product;
      });
      setProductQuantity(newProductQuantity);
      return;
    }
  };

  const handleRemoveQuantity = (productId, mode) => {
    if (mode === "cart") {
      const newCartList = cartList.map((product) => {
        if (product.id === productId && product.quantity > 1) {
          return { ...product, quantity: product.quantity - 1 };
        }
        return product;
      });
      setCartList(newCartList);
      return;
    } else if (mode === "product") {
      const newProductQuantity = productQuantity.map((product) => {
        if (product.id === productId && product.quantity > 0) {
          return { ...product, quantity: product.quantity - 1 };
        }
        return product;
      });
      setProductQuantity(newProductQuantity);
      return;
    }
  };

  const handleAddToCart = (productId) => {
    const product = products.find((product) => product.id === productId);
    const pQuantity = productQuantity.find(
      (product) => product.id === productId
    );

    if (!product || !pQuantity) return;

    const newCartList = [...cartList];
    const productInCart = newCartList.find(
      (product) => product.id === productId
    );

    if (productInCart) {
      productInCart.quantity += pQuantity.quantity;
    } else if (pQuantity.quantity === 0) {
      alert(`Please select quantity for ${product.productName}`);
    } else {
      newCartList.push({ ...product, quantity: pQuantity.quantity });
    }
    setCartList(newCartList);
  };

  const handleRemoveFromCart = (productId) => {
    const newCartList = cartList.filter((product) => product.id !== productId);
    setCartList(newCartList);
  };

  const handleClearCart = () => {
    setCartList([]);
  };

  return (
    <div>
      <NavBar quantity={cartList.length} />
      <div className="GroceriesApp-Container">
        <ProductsContainer
          products={products}
          handleAddQuantity={handleAddQuantity}
          handleRemoveQuantity={handleRemoveQuantity}
          handleAddToCart={handleAddToCart}
          productQuantity={productQuantity}
          /* these are available if you want them in ProductsContainer */
          handleEdit={handleEdit}
          handleDelete={handleDelete}
          formData={formData}
          handleOnChange={handleOnChange}
          handleOnSubmit={handleOnSubmit}
          postResponse={postResponse}
          register={register}
          handleSubmit={handleSubmit}
          errors={errors}
          reset={reset}
          isEditing={isEditing}
        />
        <CartContainer
          cartList={cartList}
          handleRemoveFromCart={handleRemoveFromCart}
          handleAddQuantity={handleAddQuantity}
          handleRemoveQuantity={handleRemoveQuantity}
          handleClearCart={handleClearCart}
        />
      </div>
    </div>
  );
}
