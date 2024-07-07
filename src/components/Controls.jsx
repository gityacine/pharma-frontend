import "../styles/controls.css";

export default function Controls({ id, allocated, max, onAllocate, onDeallocate }) {

    return (
        <div className="row">
            <button onClick={() => {
                if (allocated > 0) {
                    onDeallocate(id);
                }
            }}>-</button>
            <span className="current">{allocated}</span>
            <button onClick={() => {
                if (allocated < max) {
                    onAllocate(id);
                }
            }}>+</button>
        </div>
    );
}