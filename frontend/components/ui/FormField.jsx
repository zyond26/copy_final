/**
 * Ô nhập liệu chuẩn: label + input/select/textarea + lỗi + gợi ý.
 * Dùng cho MỌI form trong hệ thống để giao diện thống nhất.
 */
export default function FormField({
  label,
  required = false,
  error,        // chuỗi lỗi validate (hiện màu đỏ)
  hint,         // gợi ý nhỏ dưới ô nhập (vd: quy tắc mật khẩu)
  as = 'input', // input | select | textarea
  children,     // dùng cho <option> khi as="select"
  ...props
}) {
  const Tag = as;
  const baseClass = as === 'input' ? 'form-input' : `form-${as}`;
  return (
    <div className="form-group">
      {label && (
        <label className="form-label">
          {label} {required && <span className="required">*</span>}
        </label>
      )}
      <Tag
        className={`${baseClass}${error ? ' form-input--error' : ''}`}
        {...props}
      >
        {children}
      </Tag>
      {error && <p className="form-error">{error}</p>}
      {!error && hint && <p className="form-hint">{hint}</p>}
    </div>
  );
}
