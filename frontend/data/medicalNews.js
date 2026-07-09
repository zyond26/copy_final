// Medical information data - Thông tin y tế
export const MEDICAL_NEWS = [
  {
    id: 1,
    icon: '🐒',
    title: 'Đậu Mùa Khỉ (Mpox)',
    category: 'GENERAL',
    summary: 'Cảnh báo: Tổ chức Y tế Thế giới (WHO) tiếp tục giám sát các biến chủng Mpox lây lan nhanh',
    source: 'Tổ chức Y tế Thế giới (WHO) & Bộ Y tế Việt Nam',
    citation: 'https://www.who.int/news-room/fact-sheets/detail/monkeypox',
    description: `Mpox (đậu mùa khỉ) là bệnh do virus đậu mùa khỉ gây ra. Đây là bệnh truyền nhiễm cấp tính có khả năng lây lan từ người sang người qua tiếp xúc gần gũi với người bị nhiễm bệnh hoặc vật dụng bị ô nhiễm.

Các triệu chứng thường xuất hiện từ 5-21 ngày sau khi nhiễm virus:
- Phát ban mụn nước, mụn mủ trên mặt, trong miệng hoặc trên cơ thể
- Sốt cao đột ngột, đau đầu dữ dội
- Nổi hạch bạch huyết (ở cổ, nách hoặc bẹn) - đây là đặc điểm phân biệt với các bệnh phát ban khác
- Đau cơ, đau lưng và mệt mỏi suy nhược cơ thể

Biến chứng nguy hiểm:
- Nhiễm trùng thứ phát ở da dẫn đến sẹo sâu hoặc hoại tử
- Viêm phổi, viêm não hoặc nhiễm trùng giác mạc gây mù lòa
- Tỷ lệ tử vong cao hơn ở trẻ em, phụ nữ mang thai và người suy giảm miễn dịch (như nhiễm HIV).`,
    riskLevel: 'HIGH',
    tags: ['Truyền nhiễm', 'Da liễu', 'Cảnh báo'],
    symptoms: [
      'Phát ban dạng mụn nước, mụn mủ',
      'Sốt cao đột ngột',
      'Nổi hạch bạch huyết (cổ, nách, bẹn)',
      'Đau đầu dữ dội',
      'Đau mỏi cơ và đau lưng',
      'Mệt mỏi suy nhược',
    ],
    prevention: [
      'Tránh tiếp xúc trực tiếp hoặc gần gũi với người có triệu chứng nghi ngờ',
      'Rửa tay thường xuyên bằng xà phòng hoặc dung dịch sát khuẩn',
      'Che miệng và mũi khi ho hoặc hắt hơi',
      'Vệ sinh và khử trùng bề mặt các vật dụng thường xuyên chạm vào',
      'Tiêm vắc-xin phòng Mpox cho các đối tượng có nguy cơ cao',
      'Khai báo y tế và cách ly ngay khi có dấu hiệu phát ban nghi ngờ',
    ],
    treatment: 'Hầu hết các trường hợp Mpox có triệu chứng nhẹ và tự khỏi sau 2-4 tuần. Điều trị chủ yếu là giảm triệu chứng, chăm sóc tổn thương da tránh nhiễm trùng. Trong các trường hợp nặng, thuốc kháng virus như Tecovirimat (TPOXX) có thể được chỉ định dưới sự giám sát y tế.',
    whenToSeeDoctor:
      'Liên hệ ngay với cơ sở y tế khi xuất hiện phát ban dạng bọng nước kèm sốt hoặc hạch to, đặc biệt nếu có lịch sử tiếp xúc với người nghi ngờ nhiễm Mpox.',
  },
  {
    id: 2,
    icon: '💓',
    title: 'Bệnh Tim Mạch',
    category: 'GENERAL',
    summary: 'Bệnh tim mạch là nguyên nhân hàng đầu gây tử vong trên thế giới',
    source: 'Liên đoàn Tim mạch Thế giới (WHF) & Hội Tim mạch học Việt Nam',
    citation: 'https://world-heart-federation.org/world-heart-day/',
    description: `Bệnh tim mạch bao gồm các bệnh liên quan đến tim và các mạch máu như: bệnh động mạch vành, tai biến mạch não, suy tim...

Các yếu tố nguy cơ chính:
- Huyết áp cao
- Rối loạn lipid máu
- Hút thuốc
- Tiểu đường
- Béo phì
- Ít vận động
- Stress kéo dài

Theo thống kê, bệnh tim mạch chiếm khoảng 17% tỷ lệ tử vong toàn cầu. Tuy nhiên, nhiều trường hợp có thể phòng ngừa hoặc kiểm soát tốt nếu phát hiện sớm.

Xu hướng hiện tại:
- Bệnh tim mạch ngày càng trẻ hóa, thậm chí bắt gặp ở những người 30-40 tuổi
- Tỷ lệ tử vong do tai biến mạch não tăng 15% trong 5 năm qua
- COVID-19 làm tăng nguy cơ tội tim và phổi`,
    riskLevel: 'HIGH',
    tags: ['Tim mạch', 'Mãn tính', 'Phòng ngừa'],
    symptoms: [
      'Đau tức ngực (đặc biệt khi gắng sức)',
      'Khó thở',
      'Mệt mỏi bất thường',
      'Choáng váng hoặc ngất xỉu',
      'Nhịp tim nhanh không đều',
      'Đau vai, cánh tay trái',
    ],
    prevention: [
      'Tập thể dục đều đặn: 150 phút/tuần',
      'Ăn chế độ DASH: nhiều rau, trái cây, cá, hạt',
      'Giảm muối: dưới 2.3g/ngày',
      'Không hút thuốc',
      'Giảm cân (nếu béo phì)',
      'Kiểm tra huyết áp và cholesterol định kỳ',
      'Quản lý stress',
    ],
    treatment:
      'Điều trị tùy vào loại bệnh: dùng thuốc hạ huyết áp, hạ cholesterol, mỏng máu; cấy stent hoặc phẫu thuật bypass; phục hồi chức năng sau bệnh.',
    whenToSeeDoctor:
      'Đau tức ngực, khó thở, mệt mỏi bất thường là dấu hiệu cần gặp bác sĩ ngay.',
  },
  {
    id: 3,
    icon: '🩺',
    title: 'Tiểu Đường',
    category: 'GENERAL',
    summary: 'Số người bị tiểu đường tăng gấp 3 lần trong 20 năm qua',
    source: 'Hiệp hội Đái tháo đường Hoa Kỳ (ADA) & Bộ Y tế Việt Nam',
    citation: 'https://diabetes.org/',
    description: `Tiểu đường là bệnh mãn tính do cơ thể không thể điều chỉnh lượng đường trong máu. Có 2 loại chính:
- Tiểu đường type 1: Hệ miễn dịch tấn công tuyến tụy
- Tiểu đường type 2: Kháng insulin (phổ biến hơn, chiếm 90% các trường hợp)

Xu hướng nguy hiểm:
- Ở Việt Nam, có khoảng 4 triệu người bị tiểu đường
- Tỷ lệ mắc bệnh tăng 3% mỗi năm
- Tiểu đường type 2 ngày càng trẻ hóa, bắt gặp ở trẻ em và thanh niên
- Tiểu đường là nguyên nhân hàng đầu gây mù lòa, suy thận, đợt cắt cụt chi

Biến chứng nguy hiểm:
- Bệnh mắt đái tháo đường
- Suy thận mãn tính
- Bệnh chân đái tháo đường (nguy cơ cắt cụt)
- Bệnh tim mạch
- Tai biến mạch não`,
    riskLevel: 'HIGH',
    tags: ['Nội tiết', 'Mãn tính', 'Biến chứng'],
    symptoms: [
      'Khát nước nhiều',
      'Đi tiểu nhiều lần',
      'Cảm thấy mệt mỏi',
      'Giảm cân không rõ nguyên nhân',
      'Vết thương lành chậm',
      'Mờ mắt',
      'Tê hoặc đau chân',
    ],
    prevention: [
      'Duy trì cân nặng hợp lý (BMI 18.5-24.9)',
      'Tập thể dục 150 phút/tuần',
      'Ăn chế độ giàu xơ: ngũ cốc nguyên hạt, rau, trái cây',
      'Giảm đường và đồ uống có đường',
      'Giảm chất béo bão hòa',
      'Không hút thuốc, hạn chế rượu',
      'Kiểm tra đường huyết định kỳ (đặc biệt nếu có tiền sử gia đình)',
    ],
    treatment:
      'Type 1: dùng insulin; Type 2: thay đổi lối sống, dùng các loại thuốc (metformin, inhibitor DPP-4...). Quản lý huyết áp, cholesterol, kiểm tra mắt và chân định kỳ.',
    whenToSeeDoctor:
      'Khát nước nhiều, đi tiểu thường xuyên, mệt mỏi bất thường là dấu hiệu cần kiểm tra.',
  },
  {
    id: 4,
    icon: '🧠',
    title: 'Đột Quỵ Mạch Não',
    category: 'GENERAL',
    summary: 'Cảnh báo: Đột quỵ có thể xảy ra ở bất kỳ độ tuổi nào',
    source: 'Tổ chức Đột quỵ Thế giới (WSO) & Hội Đột quỵ Việt Nam',
    citation: 'https://www.world-stroke.org/',
    description: `Đột quỵ là sự mất máu cấp tính đến não. Có 2 loại chính:
- Đột quỵ thiếu máu (85%): Do tắc mạch máu não
- Đột quỵ chảy máu (15%): Do vỡ mạch máu não

Thống kê đáng lo ngại:
- Mỗi năm có 16 triệu người mắc đột quỵ lần đầu tiên
- Đột quỵ là nguyên nhân gây tàn tật hàng đầu ở người lớn
- Tỷ lệ tử vong khoảng 10-15% trong tháng đầu
- Những người sống sót có thể để lại di chứng nặng nề

Yếu tố nguy cơ:
- Huyết áp cao (nguy cơ cao nhất)
- Rối loạn nhịp tim (nhất là cuống nhĩ)
- Hút thuốc
- Tiểu đường
- Cholesterol cao
- Béo phì
- Uống rượu quá mức

Dấu hiệu cảnh báo (sử dụng BỌ TIÊN):
- Bồn chồn/chóng mặt bất thường
- Ô nhìn mờ hoặc mất thị lực
- Tê hoặc yếu một bên cơ thể
- Ích nói leng keng, nói không rõ
- Ế cơ mặt (méo miệng)
- Nhân biết được triệu chứng này cần gọi cấp cứu NGAY`,
    riskLevel: 'HIGH',
    tags: ['Thần kinh', 'Cấp cứu', 'Phòng ngừa'],
    symptoms: [
      'Tê hoặc yếu một bên cơ thể',
      'Mồm miệng méo mó',
      'Nói leng keng hoặc không rõ',
      'Mờ mắt hoặc mất thị lực',
      'Chóng mặt hoặc mất thăng bằng',
      'Đau đầu dữ dội',
      'Nôn nao hoặc nôn',
    ],
    prevention: [
      'Kiểm soát huyết áp (dưới 120/80 mmHg)',
      'Dừng hút thuốc',
      'Ăn chế độ DASH',
      'Tập thể dục đều đặn',
      'Uống ít rượu',
      'Duy trì cân nặng lý tưởng',
      'Kiểm tra sức khỏe định kỳ',
      'Kiểm soát tiểu đường và cholesterol',
    ],
    treatment:
      'Cấp cứu ngay: thuốc huyết khối (nếu trong 4,5 giờ), hỗ trợ hô hấp, kiểm soát huyết áp. Phục hồi chức năng: vật lý trị liệu, phục hồi ngôn ngữ.',
    whenToSeeDoctor:
      'Gọi cấp cứu ngay nếu có bất kỳ dấu hiệu nào ở trên, đặc biệt tê bên ngoài hoặc méo miệng.',
  },
  {
    id: 5,
    icon: '😷',
    title: 'Cúm Mùa',
    category: 'GENERAL',
    summary: 'Cúm mùa bùng phát vào mùa đông - cần tiêm vắc xin phòng ngừa',
    source: 'Trung tâm kiểm soát và phòng ngừa dịch bệnh (CDC Hoa Kỳ)',
    citation: 'https://www.cdc.gov/flu/',
    description: `Cúm mùa (influenza) là bệnh truyền nhiễm cấp tính do virus influenza gây ra. Là bệnh tự giới hạn nhưng có thể gây biến chứng nặng.

Thống kê và xu hướng:
- Mỗi năm có 290,000-650,000 ca tử vong do cúm toàn cầu
- Cúm gây ra 3-5 triệu trường hợp bệnh nặng
- Tỷ lệ nhiễm cúm tăng mạnh ở những nơi đông dân

Nhóm nguy cơ cao:
- Trẻ em dưới 5 tuổi
- Người cao tuổi (65 tuổi trở lên)
- Phụ nữ mang thai
- Người có bệnh mãn tính (hen suyễn, bệnh tim...)
- Người có miễn dịch yếu

Biến chứng có thể xảy ra:
- Viêm phổi
- Viêm cơ tim
- Viêm não
- Suy hô hấp`,
    riskLevel: 'MEDIUM',
    tags: ['Virus', 'Truyền nhiễm', 'Mùa đông'],
    symptoms: [
      'Sốt cao đột ngột (38-40°C)',
      'Toàn thân đau nhức',
      'Mệt mỏi cực độ',
      'Ho khô',
      'Đau họng',
      'Chảy nước mũi',
      'Nhức đầu',
      'Có thể có buồn nôn',
    ],
    prevention: [
      'Tiêm vắc xin cúm hàng năm (tốt nhất tháng 9-10)',
      'Rửa tay thường xuyên',
      'Đeo khẩu trang nơi đông người',
      'Hạn chế tiếp xúc gần với người bệnh',
      'Giữ vệ sinh cá nhân',
      'Nâng cao sức đề kháng: ngủ đủ, ăn uống đủ dưỡng chất',
    ],
    treatment:
      'Điều trị hỗ trợ: nghỉ ngơi, uống nước nhiều, dùng paracetamol hạ sốt. Nếu phát hiện sớm có thể dùng thuốc kháng virus oseltamivir (Tamiflu).',
    whenToSeeDoctor:
      'Sốt cao kéo dài trên 3 ngày, khó thở, hoặc các triệu chứng nặng cần gặp bác sĩ.',
  },
  {
    id: 6,
    icon: 'Bone',
    title: 'Loãng Xương',
    category: 'GENERAL',
    summary: 'Loãng xương thường im lặng - phát hiện khi xương đã gãy',
    source: 'Quỹ Loãng xương Quốc tế (IOF)',
    citation: 'https://www.osteoporosis.foundation/',
    description: `Loãng xương (Osteoporosis) là bệnh mất khối lượng xương, làm xương yếu và dễ gãy. Thường gọi là "bệnh im lặng" vì không có triệu chứng cho đến khi xương gãy.

Thống kê:
- Khoảng 1 trong 3 phụ nữ trên 50 tuổi bị gãy xương do loãng xương
- Ở đàn ông, tỷ lệ là 1 trong 5
- Loãng xương gây ra hơn 8 triệu trường hợp gãy xương mỗi năm
- Gãy xương hông là biến chứng nguy hiểm nhất, thường dẫn đến tàn tật

Yếu tố nguy cơ:
- Tuổi tác (phụ nữ sau mãn kinh, nam trên 70 tuổi)
- Thiếu hormone nữ (estrogen) hoặc testosterone
- Ít vận động thể chất
- Thiếu calci và vitamin D
- Hút thuốc, uống rượu quá mức
- Một số loại thuốc (corticosteroid)`,
    riskLevel: 'MEDIUM',
    tags: ['Xương', 'Tuổi tác', 'Phòng ngừa'],
    symptoms: [
      'Không có triệu chứng ban đầu (thường khám phá khi gãy)',
      'Đau lưng hoặc cột sống',
      'Cao độ giảm (co gấp)',
      'Gãy xương dễ dàng từ những chấn thương nhẹ',
    ],
    prevention: [
      'Bổ sung calci đủ (1000-1200mg/ngày): sữa, cà chua, rau xanh',
      'Bổ sung vitamin D (600-800 IU/ngày hoặc tiếp xúc ánh nắng)',
      'Tập thể dục chịu tải: đi bộ, chạy, tập tạ',
      'Không hút thuốc',
      'Hạn chế rượu',
      'Kiểm tra mật độ xương (DEXA scan) định kỳ sau tuổi 50',
    ],
    treatment:
      'Thuốc bisphosphonates (như alendronate), hormone estrogen (HRT), hoặc các thuốc khác. Bổ sung calci và vitamin D.',
    whenToSeeDoctor:
      'Nếu gãy xương dễ dàng từ những chấn thương nhẹ, hay bị đau lưng cần khám.',
  },
  {
    id: 7,
    icon: '🫀',
    title: 'Suy Tim',
    category: 'GENERAL',
    summary: 'Suy tim là tình trạng tim không bơm máu đủ nuôi cơ thể',
    source: 'Hội Tim mạch Châu Âu (ESC)',
    citation: 'https://www.escardio.org/',
    description: `Suy tim là tình trạng tim không thể bơm đủ máu để nuôi nhu cầu của cơ thể. Thường là kết quả của những bệnh khác làm yếu tim.

Phân loại:
- Suy tim tâm trương: Tim không giãn được, dẫn đến tim không đổ đầy máu
- Suy tim tâm thu: Tim không co bóp được mạnh, không bơm đủ máu

Nguyên nhân chính:
- Bệnh động mạch vành
- Huyết áp cao kéo dài
- Rối loạn nhịp tim
- Bệnh cơ tim
- Viêm cơ tim
- COVID-19 (một số trường hợp)

Thống kê:
- Khoảng 65 triệu người bị suy tim trên thế giới
- Tỷ lệ tử vong cao nếu không điều trị`,
    riskLevel: 'HIGH',
    tags: ['Tim mạch', 'Mãn tính', 'Cấp cứu'],
    symptoms: [
      'Khó thở, đặc biệt khi gắng sức',
      'Mệt mỏi',
      'Sưng chân, mắt cá chân, hoặc bụng',
      'Nhịp tim nhanh hoặc không đều',
      'Khó ngủ',
      'Không thèm ăn',
      'Suy giảm nhận thức',
    ],
    prevention: [
      'Kiểm soát huyết áp',
      'Duy trì cân nặng hợp lý',
      'Tập thể dục đều đặn',
      'Ăn chế độ DASH',
      'Không hút thuốc',
      'Hạn chế rượu và muối',
      'Kiểm tra sức khỏe định kỳ',
    ],
    treatment:
      'Dùng các thuốc như ACE inhibitor, beta-blocker, nitroglycerin. Cấy máy tạo nhịp hoặc ghép tim trong trường hợp nặng.',
    whenToSeeDoctor:
      'Khó thở tăng lên, sưng chân nhiều, hay mệt mỏi bất thường cần gặp bác sĩ ngay.',
  },
  {
    id: 8,
    icon: '🐢',
    title: 'Hội Chứng Cổ Rùa (Text Neck)',
    category: 'YOUTH',
    summary: 'Cảnh báo giới trẻ: Tư thế cúi đầu dùng điện thoại liên tục gây biến dạng cột sống',
    source: 'Hiệp hội Cột sống Bắc Mỹ (NASS) & Bộ Y tế Việt Nam',
    citation: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7913059/',
    description: `Hội chứng cổ rùa (Text Neck / Turtle Neck) là tình trạng thoái hóa cột sống cổ do đầu liên tục hướng về phía trước và cúi xuống khi sử dụng điện thoại, máy tính sai tư thế. 
Đầu người trưởng thành nặng trung bình khoảng 5kg. Khi cúi đầu nhìn màn hình ở góc 60 độ, lực nén lên đốt sống cổ tăng lên tới 27kg - tương đương một đứa trẻ 8 tuổi ngồi trên cổ bạn. 

Lâu ngày, tư thế này làm biến dạng đường cong sinh lý của cột sống, chèn ép dây thần kinh và gây ra những cơn đau mãn tính cực kỳ khó chịu.`,
    riskLevel: 'MEDIUM',
    tags: ['Cơ xương khớp', 'Giới trẻ', 'Cảnh báo'],
    symptoms: [
      'Đau mỏi cổ, vai, gáy liên tục',
      'Đầu có xu hướng nhô về phía trước khi đứng tự nhiên',
      'Tê bì cánh tay hoặc ngón tay do chèn ép thần kinh',
      'Đau đầu khu vực nửa đầu sau gáy',
      'Giảm biên độ quay cổ vai',
    ],
    prevention: [
      'Giữ điện thoại ngang tầm mắt khi sử dụng',
      'Áp dụng quy tắc 20-20-20: Cứ 20 phút làm việc, nhìn xa 20 feet (6m) trong 20 giây',
      'Thực hiện bài tập kéo cằm (Chin-tuck) để điều chỉnh cột sống cổ',
      'Đảm bảo bàn làm việc và ghế ngồi có tựa đầu phù hợp',
    ],
    treatment: 'Vật lý trị liệu giải chèn ép, chỉnh tư thế lao động và sinh hoạt, chườm ấm hoặc dùng thuốc giảm đau cơ năng nhẹ. Trường hợp chèn ép rễ thần kinh nặng cần can thiệp ngoại khoa chuyên sâu.',
    whenToSeeDoctor:
      'Cần đi khám ngay nếu có dấu hiệu tê buốt dọc cánh tay, yếu cơ tay hoặc các cơn đau cổ lan tỏa gây mất ngủ.',
  },
  {
    id: 9,
    icon: '🌙',
    title: 'Suy Thận & Đảo Lộn Nhịp Sinh Học Do Thức Khuya',
    category: 'YOUTH',
    summary: 'Cảnh báo nguy hiểm: Thói quen thức đêm sau 23h tàn phá chức năng cầu thận của người trẻ',
    source: 'Hiệp hội Thận học Quốc tế (ISN) & Hội Thận học Việt Nam',
    citation: 'https://www.kidney.org/news/sleep-deprivation-kidney-disease',
    description: `Thận hoạt động theo nhịp sinh học 24 giờ. Ban đêm là thời gian cơ thể nghỉ ngơi, huyết áp giảm xuống và thận giảm bớt tải trọng làm việc.
Khi thức khuya thường xuyên sau 23h, cơ thể bị kích thích tăng tiết hormone cortisol và adrenaline. Việc này làm co mạch máu, giữ nước, dẫn đến tăng huyết áp cục bộ tại các cầu thận. Thận bị ép buộc phải hoạt động quá công suất trong thời gian dài sẽ dẫn đến xơ hóa cầu thận và suy giảm chức năng lọc máu không thể phục hồi.

Đồng thời, mất ngủ kinh niên làm rối loạn hệ miễn dịch và gia tăng nguy cơ tiểu đường, trực tiếp gây ra bệnh thận mãn tính.`,
    riskLevel: 'HIGH',
    tags: ['Thận học', 'Nhịp sinh học', 'Lối sống'],
    symptoms: [
      'Tiểu đêm nhiều lần hoặc nước tiểu có nhiều bọt lâu tan (tiểu đạm)',
      'Sưng phù mí mắt hoặc mắt cá chân vào buổi sáng',
      'Mệt mỏi dai dẳng, khó tập trung, da xanh xao',
      'Huyết áp tăng cao đột ngột không rõ nguyên nhân',
      'Đau mỏi vùng thắt lưng dưới',
    ],
    prevention: [
      'Thiết lập thói quen đi ngủ trước 23 giờ đêm',
      'Đảm bảo giấc ngủ sâu từ 7 - 8 tiếng mỗi ngày',
      'Hạn chế tuyệt đối các chất kích thích (trà sữa, cà phê, nước tăng lực) vào buổi tối',
      'Uống đủ 1.5 - 2 lít nước lọc chia đều trong ngày',
      'Hạn chế đồ ăn mặn, thức ăn nhanh ban đêm',
    ],
    treatment: 'Điều chỉnh lối sống, kiểm soát huyết áp bằng thuốc ức chế men chuyển, ăn nhạt, bảo vệ cầu thận. Đối với suy thận giai đoạn cuối cần lọc máu chu kỳ hoặc ghép thận.',
    whenToSeeDoctor:
      'Gặp bác sĩ ngay khi thấy nước tiểu sủi bọt nhiều lần liên tiếp, sưng phù nề mi mắt/chân hoặc mệt mỏi suy nhược kéo dài sau các đêm thức muộn.',
  },
];
