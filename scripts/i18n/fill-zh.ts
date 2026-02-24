import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

type Messages = Record<string, string>;

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, "../..");

const KEEP_AS_IS = new Set<string>([
  "...",
  "./dag-parser",
  "./layer-definitions",
  "./layers/parameters",
  "\"",
  "{expr0}_{counter}",
  "@aryagm",
  "@xyflow/react",
  "•",
  "+",
  "×",
  "⚠️",
  "🐍",
  "Keras",
  "PyTorch",
  "TensorFlow",
  "ELU",
  "ReLU",
  "Softmax",
  "Tanh",
  "Sigmoid",
  "Leaky ReLU",
  "GRU",
  "LSTM",
  "Conv1D",
  "Conv2D",
  "Conv2DTranspose",
  "SeparableConv2D",
  "AveragePooling2D",
  "MaxPool2D",
  "GlobalAveragePooling2D",
  "ZeroPadding2D",
  "Cropping2D",
  "SpatialDropout2D",
  "BatchNormalization",
  "LayerNormalization",
  "TimeDistributed",
  "Permute",
  "Reshape",
  "Flatten",
  "Embedding",
  "Dropout",
  "GaussianNoise",
  "Bidirectional",
  "Input",
  "Output",
  "Dense",
  "Activation",
  "Merge",
  "Dot",
  "Average",
  "Add",
  "Multiply",
  "Subtract",
  "Maximum",
  "Minimum",
  "Concatenate",
  "Same",
  "Valid",
  "Linear (None)",
  "None",
  "True",
  "False",
  "CNN",
  "RNN",
]);

const EXACT_BY_KEY: Record<string, string> = {
  "category.activation.description": "非线性激活函数",
  "category.activation.name": "激活",
  "category.convolutional.description": "Conv2D 及相关层",
  "category.convolutional.name": "卷积",
  "category.core.description": "神经网络的基础构建模块",
  "category.core.name": "核心层",
  "category.dense.description": "全连接层",
  "category.dense.name": "全连接层",
  "category.input_output.description": "网络的起点和终点",
  "category.input_output.name": "输入/输出",
  "category.merge.description": "层组合运算",
  "category.merge.name": "合并",
  "category.pooling.description": "下采样与上采样",
  "category.pooling.name": "池化",
  "category.regularization.description": "批归一化与 Dropout",
  "category.regularization.name": "正则化",
  "category.sequence.description": "RNN 与嵌入层",
  "category.sequence.name": "序列",
  "category.transformation.description": "形状变换层",
  "category.transformation.name": "变换",

  "templateCategory.autoencoder.description": "用于降维的网络",
  "templateCategory.autoencoder.name": "自动编码器",
  "templateCategory.classification.description": "用于分类任务的网络",
  "templateCategory.classification.name": "分类",
  "templateCategory.cnn.description": "用于图像的卷积神经网络",
  "templateCategory.cnn.name": "CNN",
  "templateCategory.gan.description": "生成对抗网络",
  "templateCategory.gan.name": "GAN",
  "templateCategory.regression.description": "用于回归任务的网络",
  "templateCategory.regression.name": "回归",
  "templateCategory.rnn.description": "用于序列的循环网络",
  "templateCategory.rnn.name": "RNN",
  "templateCategory.transformer.description": "基于注意力的架构",
  "templateCategory.transformer.name": "Transformer",

  "template.dense-autoencoder.description":
    "用于降维与重建的对称编码器-解码器",
  "template.dense-autoencoder.name": "全连接自动编码器",
  "template.image-classifier-lenet.description":
    "用于图像分类的经典 CNN，计算机视觉的“Hello World”",
  "template.image-classifier-lenet.name": "图像分类器（LeNet）",
  "template.resnet-mini.description": "带跳跃连接的残差网络，展示函数式架构",
  "template.resnet-mini.name": "ResNet 迷你块",
  "template.simple-classifier.description": "用于分类任务的基础全连接网络",
  "template.simple-classifier.name": "简单分类器",
  "template.tabular-mlp.description": "用于结构化表格数据的多层感知机",
  "template.tabular-mlp.name": "表格 MLP",
  "template.text-classifier-lstm.description":
    "使用嵌入层和 LSTM 的文本分类序列建模",
  "template.text-classifier-lstm.name": "文本分类器（LSTM）",

  "tag.autoencoder": "自动编码器",
  "tag.beginner": "入门",
  "tag.bottleneck": "瓶颈",
  "tag.classic": "经典",
  "tag.classification": "分类",
  "tag.cnn": "CNN",
  "tag.dense": "全连接",
  "tag.embedding": "嵌入",
  "tag.functional": "函数式",
  "tag.lstm": "LSTM",
  "tag.mlp": "MLP",
  "tag.nlp": "NLP",
  "tag.reconstruction": "重建",
  "tag.residual": "残差",
  "tag.resnet": "ResNet",
  "tag.sequence": "序列",
  "tag.skip-connection": "跳跃连接",
  "tag.structured": "结构化",
  "tag.tabular": "表格",
  "tag.unsupervised": "无监督",
  "tag.vision": "视觉",

  "engine.dag.expr0_counter": "{expr0}_{counter}",
  "engine.dag.layers_parameters": "./layers/parameters",
  "engine.dag.network_contains_cycles_dag_structure_required":
    "网络包含环路，需要 DAG 结构",
  "engine.dag.network_must_have_at_least_one_input_layer":
    "网络至少需要一个 Input 层",
  "engine.dag.network_must_have_at_least_one_layer": "网络至少需要一个层",
  "engine.dag.network_must_have_at_least_one_output_layer":
    "网络至少需要一个 Output 层",
  "engine.dag.node_nodeid_not_found": "未找到节点 '{nodeId}'",
  "engine.dag.xyflow_react": "@xyflow/react",
  "engine.shape.could_not_compute_output_shape_for_type":
    "无法计算 {type} 的输出形状",
  "engine.shape.could_not_determine_input_shapes_for_type":
    "无法确定 {type} 的输入形状",
  "engine.shape.dag_parser": "./dag-parser",
  "engine.shape.error_computing_shape_expr0": "计算形状出错：{expr0}",
  "engine.shape.input_layer_definition_not_found": "未找到 Input 层定义",
  "engine.shape.invalid_input_for_type": "{type} 的输入无效",
  "engine.shape.invalid_input_shape_inputshape": "输入形状无效：{inputShape}",
  "engine.shape.layer_definitions": "./layer-definitions",
  "engine.shape.type_has_no_input_connections": "{type} 没有输入连接",
  "engine.shape.unknown_error": "未知错误",
  "engine.shape.unknown_layer_type_type": "未知层类型：{type}",
};

const EXACT_BY_VALUE: Record<string, string> = {
  "• Code updates automatically as you modify your network":
    "• 当你修改网络时，代码会自动更新",
  "• Connect blocks by dragging from output handles to input handles":
    "• 从输出句柄拖拽到输入句柄即可连接模块",
  "• Copy the code to use in your Python projects":
    "• 复制代码用于你的 Python 项目",
  "• Double-click blocks to edit their parameters":
    "• 双击模块可编辑其参数",
  "• Drag blocks from the left palette onto the canvas":
    "• 从左侧面板拖拽模块到画布",
  "• The right panel shows generated TensorFlow/Keras code":
    "• 右侧面板显示生成的 TensorFlow/Keras 代码",
  "• Use the trash icon to delete blocks": "• 使用垃圾桶图标删除模块",
  "💻 Code Generation": "💻 代码生成",
  "📂 Project Management": "📂 项目管理",
  "🧱 Building Your Network": "🧱 构建你的网络",
  "Are you sure you want to clear all blocks from the canvas? This action cannot be undone.":
    "确定要清空画布上的所有模块吗？此操作无法撤销。",
  "Build neural network architectures visually with intuitive drag-and-drop blocks":
    "通过直观的拖拽模块以可视化方式构建神经网络架构",
  "Build neural network architectures visually with intuitive drag-and-drop blocks. Watch the demo video to get started.":
    "通过直观的拖拽模块以可视化方式构建神经网络架构。观看演示视频即可开始。",
  "BlockDL Help & Instructions": "BlockDL 帮助与说明",
  BlockDL: "BlockDL",
  "Learn how to use BlockDL to build neural network architectures visually":
    "了解如何使用 BlockDL 以可视化方式构建神经网络架构",
  "Load a previously saved project": "加载之前保存的项目",
  "Save your project as a JSON file": "将项目保存为 JSON 文件",
  "Remove all blocks from the canvas": "清空画布上的所有模块",
  "Code": "代码",
  Layer: "层",
  "Layers": "层",
  "Templates": "模板",
  "Framework": "框架",
  "Import": "导入",
  "Import:": "导入：",
  "Export": "导出",
  "Export:": "导出：",
  "Import Error": "导入错误",
  "Clear All": "清空全部",
  "Clear All Blocks": "清空所有模块",
  "Clear All:": "清空全部：",
  "Copy Code": "复制代码",
  "Copied!": "已复制！",
  "Download .py": "下载 .py",
  "Save": "保存",
  "Loading": "加载中",
  "Loading demo video...": "正在加载演示视频...",
  "Demo Video Unavailable": "演示视频不可用",
  "The demo video could not be loaded.": "无法加载演示视频。",
  "Your browser does not support the video tag.": "你的浏览器不支持 video 标签。",
  "Welcome to BlockDL": "欢迎使用 BlockDL",
  "Help": "帮助",
  "Cancel": "取消",
  "Close": "关闭",
  "OK": "确定",
  "Edit": "编辑",
  "Delete this block": "删除此模块",
  "Configure the parameters for this layer.": "配置该层的参数。",
  "Made with ❤️ by": "由以下作者用 ❤️ 制作",
  "Redo (Ctrl+Shift+Z)": "重做（Ctrl+Shift+Z）",
  "Undo (Ctrl+Z)": "撤销（Ctrl+Z）",
  "found matching \"": "匹配到 \"",
  "more": "更多",

  "Convolutional": "卷积",
  "Core Layers": "核心层",
  "Dense Layers": "全连接层",
  "Pooling": "池化",
  "Regularization": "正则化",
  "Sequence": "序列",
  "Transformation": "变换",
  "Classification": "分类",
  "Regression": "回归",
  "Autoencoder": "自动编码器",
  "Transformer": "Transformer",
  Sum: "求和",

  "Activation Type": "激活类型",
  "Activation function": "激活函数",
  "Activation function to use": "要使用的激活函数",
  "Activation function for recurrent connections": "循环连接使用的激活函数",
  "Activation function for the GRU gates": "GRU 门控的激活函数",
  "Activation function for the LSTM gates": "LSTM 门控的激活函数",
  "Type of activation function": "激活函数类型",
  "Applies activation function": "应用激活函数",
  "No activation function": "无激活函数",
  "Rectified Linear Unit": "修正线性单元",
  "Sigmoid function": "Sigmoid 函数",
  "Hyperbolic Tangent": "双曲正切",
  "Hyperbolic tangent": "双曲正切",
  "Hyperbolic tangent (default)": "双曲正切（默认）",
  "Sigmoid function (default)": "Sigmoid 函数（默认）",
  "Faster approximation of sigmoid": "Sigmoid 的更快近似",
  "Hard Sigmoid": "Hard Sigmoid",
  "Exponential Linear Unit": "指数线性单元",
  "Leaky Rectified Linear Unit": "带泄露修正线性单元",
  "For probability distributions": "用于概率分布",

  "Units": "单元数",
  "Units/Filters": "单元数/过滤器数",
  "Filters": "过滤器数",
  "Kernel Size": "卷积核大小",
  "Pool Size": "池化窗口大小",
  "Strides": "步幅",
  "Strides (optional)": "步幅（可选）",
  "Strides of pooling operation": "池化操作的步幅",
  "Stride of convolution": "卷积步幅",
  "Stride of convolution (controls upsampling factor)": "卷积步幅（控制上采样倍数）",
  "Size": "大小",
  "Size of flattened vector": "展平向量大小",
  "Size of pooling window": "池化窗口大小",
  "Size of convolution kernel": "卷积核大小",
  "Size of convolution window": "卷积窗口大小",
  "Size of 1D convolution kernel": "1D 卷积核大小",
  "Size of 1D convolution window": "1D 卷积窗口大小",
  "Padding": "填充",
  "Padding strategy": "填充策略",
  "Padding to achieve predictable output size": "用于获得可预测输出尺寸的填充",
  "Padding to keep same output length": "保持相同输出长度的填充",
  "Padding to keep same output size": "保持相同输出大小的填充",
  "Padding to maintain dimensions": "保持维度的填充",
  "No padding": "不填充",
  "No padding, output length reduced": "不填充，输出长度减小",
  "No padding, output size depends on kernel and stride":
    "不填充，输出大小取决于卷积核和步幅",
  "No padding, output size reduced": "不填充，输出大小减小",
  "Amount of padding to add": "要添加的填充量",
  "Amount of cropping to apply": "要裁剪的数量",
  "Cropping": "裁剪",
  "Axis": "轴",
  "Concatenation Axis": "拼接轴",
  "Axis along which to concatenate (-1 for last axis)":
    "执行拼接的轴（-1 表示最后一维）",
  "Axis or axes to normalize (e.g., -1 or [-2, -1])":
    "要归一化的轴（例如 -1 或 [-2, -1]）",
  "Axis to normalize (usually -1 for last axis)":
    "要归一化的轴（通常 -1 表示最后一维）",
  "Epsilon": "Epsilon",
  "Small constant to prevent division by zero": "防止除零的小常数",
  "Momentum": "动量",
  "Momentum for moving average": "移动平均的动量",
  "Center": "中心化",
  "Scale": "缩放",
  "Beta": "Beta",
  "Whether to use beta parameter (learnable bias)": "是否使用 beta 参数（可学习偏置）",
  "Whether to use gamma parameter (learnable scale)": "是否使用 gamma 参数（可学习缩放）",
  "Use Bias": "使用偏置",
  "Whether to include a bias vector": "是否包含偏置向量",
  "Include bias terms": "包含偏置项",
  "No bias terms": "不包含偏置项",
  "Mask Zero": "掩码零值",
  "Whether to mask zero values in input": "是否屏蔽输入中的零值",
  "Mask zero values (for padding)": "对零值进行掩码（用于填充）",
  "No masking": "不使用掩码",
  "Return Sequences": "返回序列",
  "Whether to return the full sequence or just the last output":
    "是否返回完整序列还是仅返回最后一个输出",
  "Return only last output": "仅返回最后输出",
  "Return full sequence": "返回完整序列",
  "Return State": "返回状态",
  "Whether to return the last state in addition to output":
    "除输出外是否还返回最后状态",
  "Return only output": "仅返回输出",
  "Return output and states": "返回输出和状态",
  "Reset After": "后置重置",
  "GRU convention (whether to apply reset gate after or before matrix multiplication)":
    "GRU 约定（在矩阵乘法之前或之后应用重置门）",
  "Apply reset after matrix multiplication (CuDNN compatible)":
    "在矩阵乘法后应用重置（兼容 CuDNN）",
  "Apply reset before matrix multiplication":
    "在矩阵乘法前应用重置",
  "Merge Mode": "合并模式",
  "How to combine the inputs": "如何合并输入",
  "How to combine forward and backward outputs": "如何合并前向和后向输出",
  "Average forward and backward outputs": "对前向和后向输出取平均",
  "Concatenate forward and backward outputs": "拼接前向和后向输出",
  "Sum forward and backward outputs": "对前向和后向输出求和",
  "Multiply forward and backward outputs": "对前向和后向输出相乘",
  "Return as list [forward, backward]": "以列表形式返回 [forward, backward]",
  "Wrapped Layer Type": "包装层类型",
  "Type of RNN layer to wrap": "要包装的 RNN 层类型",
  "Type of layer to apply at each time step": "在每个时间步应用的层类型",
  "Dropout Rate": "Dropout 比例",
  "Dropout rate for the wrapped layer": "包装层的 Dropout 比例",
  "Recurrent Activation": "循环激活函数",
  "Recurrent Dropout": "循环 Dropout",
  "Fraction of units to drop for recurrent connections":
    "循环连接中要丢弃的单元比例",
  "Fraction of units to drop for input linear transformation":
    "输入线性变换中要丢弃的单元比例",
  "Fraction of input units to drop": "要丢弃的输入单元比例",
  "Fraction of feature maps to drop": "要丢弃的特征图比例",
  "Dropout regularization": "Dropout 正则化",
  "Randomly sets input units to 0 during training":
    "训练期间随机将输入单元设为 0",
  "Spatial dropout for 2D feature maps (drops entire channels)":
    "用于 2D 特征图的空间 Dropout（整通道丢弃）",
  "Standard Deviation": "标准差",
  "Standard deviation of the noise distribution": "噪声分布的标准差",
  "Depth Multiplier": "深度倍数",
  "Number of depthwise convolution output channels for each input channel":
    "每个输入通道对应的深度卷积输出通道数",
  "Dimension Order": "维度顺序",
  "New order of dimensions (1-indexed)": "新的维度顺序（从 1 开始）",
  "Target Shape": "目标形状",
  "Target shape for reshaping (excluding batch dimension)":
    "重塑目标形状（不包含 batch 维）",

  "Input Type": "输入类型",
  "Choose the type of input data": "选择输入数据类型",
  "Channels": "通道数",
  "Number of channels": "通道数量",
  "Height": "高度",
  "Height dimension of input": "输入的高度维度",
  "Width": "宽度",
  "Width dimension of input": "输入的宽度维度",
  "Sequence Length": "序列长度",
  "Length of input sequence": "输入序列长度",
  "Length of input sequences (for shape inference)": "输入序列长度（用于形状推断）",
  "Features": "特征数",
  "Features per sequence step": "每个序列步的特征数",
  "Input Dimension (Vocabulary Size)": "输入维度（词表大小）",
  "Size of the vocabulary (number of unique tokens)":
    "词表大小（唯一 token 数量）",
  "Output Dimension (Embedding Size)": "输出维度（嵌入大小）",
  "Dimension of the dense embedding vectors": "稠密嵌入向量的维度",
  "Dimensionality of the output space": "输出空间的维度",
  "Input Length (optional)": "输入长度（可选）",
  "Length of token sequence": "token 序列长度",
  "Output Type": "输出类型",
  "Type of prediction task": "预测任务类型",
  "Number of Classes": "类别数量",
  "Number of classes to predict": "要预测的类别数",
  "Output Units": "输出单元数",
  "Number of output neurons": "输出神经元数量",

  "Binary Classification (sigmoid)": "二分类（sigmoid）",
  "Multi-class Classification (softmax)": "多分类（softmax）",
  "Multi-label Classification (sigmoid)": "多标签分类（sigmoid）",
  "Regression (linear)": "回归（linear）",
  "Choose one class from many": "从多个类别中选择一个",
  "Multiple yes/no predictions": "多个是/否预测",
  "Continuous values": "连续值",
  No: "否",
  "Yes/No predictions": "是/否预测",

  "Color Image (H×W×3)": "彩色图像（H×W×3）",
  "Grayscale Image (H×W×1)": "灰度图像（H×W×1）",
  "Custom Image (H×W×C)": "自定义图像（H×W×C）",
  "Flattened Data (N,)": "展平数据（N,）",
  "Sequence Data (seq_len, features)": "序列数据（seq_len, features）",
  "Sequence Indices (seq_len,)": "序列索引（seq_len,）",
  "Images with custom channels": "具有自定义通道数的图像",
  "RGB color images": "RGB 彩色图像",
  "Single channel images like MNIST": "类似 MNIST 的单通道图像",
  "1D vector data": "1D 向量数据",
  "Time series or text data": "时间序列或文本数据",
  "Token indices for embeddings and LSTMs": "用于嵌入层和 LSTM 的 token 索引",

  "1D convolution layer": "1D 卷积层",
  "1D convolution layer for sequence data": "用于序列数据的 1D 卷积层",
  "2D convolution layer": "2D 卷积层",
  "2D convolution layer for upsampling":
    "用于上采样的 2D 卷积层",
  "Transposed 2D convolution layer for upsampling":
    "用于上采样的转置 2D 卷积层",
  "Depthwise separable 2D convolution layer": "深度可分离 2D 卷积层",
  "Cropping layer for 2D spatial data": "用于 2D 空间数据的裁剪层",
  "Zero-padding layer for 2D spatial data": "用于 2D 空间数据的零填充层",
  "Average pooling operation for 2D spatial data": "用于 2D 空间数据的平均池化操作",
  "Max pooling operation for 2D spatial data": "用于 2D 空间数据的最大池化操作",
  "Global average pooling operation for 2D spatial data":
    "用于 2D 空间数据的全局平均池化操作",
  "Embedding layer for converting indices to dense vectors":
    "将索引转换为稠密向量的嵌入层",
  "Input layer for data": "数据输入层",
  "Output layer for predictions": "预测输出层",
  "Fully connected layer": "全连接层",
  "Apply a layer to every temporal slice of an input":
    "对输入的每个时间切片应用一个层",
  "Bidirectional wrapper for RNNs": "RNN 的双向包装层",
  "Layer normalization for stabilizing training across features":
    "在特征维上稳定训练的层归一化",
  "Batch normalization layer for internal covariate shift reduction":
    "用于减小内部协变量偏移的批归一化层",
  "Gated Recurrent Unit": "门控循环单元",
  "Gated Recurrent Unit layer": "门控循环单元层",
  "Long Short-Term Memory": "长短期记忆",
  "Long Short-Term Memory recurrent layer": "长短期记忆循环层",
  "Flattens input into 1D array": "将输入展平为 1D 数组",
  "Reshapes input to a new shape": "将输入重塑为新形状",
  "Permutes the dimensions of the input": "重排输入的维度顺序",
  "Merge multiple input tensors into one": "将多个输入张量合并为一个",
  "Dot Product": "点积",
  "Dot product of inputs": "输入的点积",
  "Element-wise addition": "逐元素加法",
  "Element-wise subtraction (first - second)": "逐元素减法（第一个 - 第二个）",
  "Element-wise multiplication": "逐元素乘法",
  "Element-wise average": "逐元素平均",
  "Element-wise maximum": "逐元素最大值",
  "Element-wise minimum": "逐元素最小值",
  "Concatenate along specified axis": "沿指定轴拼接",
  "Apply additive zero-centered Gaussian noise for regularization":
    "添加零均值高斯噪声以进行正则化",

  "Basic dense network for classification tasks": "用于分类任务的基础全连接网络",
  "Classic CNN for image classification - the \"Hello World\" of computer vision":
    "用于图像分类的经典 CNN，是计算机视觉的“Hello World”",
  "Residual network with skip connections demonstrating functional architecture":
    "带跳跃连接的残差网络，展示函数式架构",
  "Multi-layer perceptron for structured tabular data":
    "用于结构化表格数据的多层感知机",
  "Sequence modeling for text classification with embeddings and LSTM":
    "使用嵌入层和 LSTM 的文本分类序列建模",
  "Symmetrical encoder-decoder for dimensionality reduction and reconstruction":
    "用于降维与重建的对称编码器-解码器",

  "All inputs must have the same number of dimensions for concatenation":
    "拼接时所有输入必须具有相同的维度数",
  "All inputs must have the same shape for element-wise operations":
    "逐元素运算时所有输入必须具有相同形状",
  "Dimension {dim} must match across all inputs for concatenation":
    "拼接时所有输入在维度 {dim} 上必须一致",
  "Activation layer requires exactly one input": "Activation 层需要且仅需要一个输入",
  "AveragePooling2D layer requires 3D input (height, width, channels)":
    "AveragePooling2D 层需要 3D 输入（height, width, channels）",
  "AveragePooling2D layer requires exactly one input":
    "AveragePooling2D 层需要且仅需要一个输入",
  "BatchNormalization layer requires at least 1D input":
    "BatchNormalization 层至少需要 1D 输入",
  "BatchNormalization layer requires exactly one input":
    "BatchNormalization 层需要且仅需要一个输入",
  "Bidirectional layer requires 2D input (sequence_length, features)":
    "Bidirectional 层需要 2D 输入（sequence_length, features）",
  "Bidirectional layer requires exactly one input":
    "Bidirectional 层需要且仅需要一个输入",
  "Conv1D layer requires 2D input (sequence_length, features)":
    "Conv1D 层需要 2D 输入（sequence_length, features）",
  "Conv1D layer requires exactly one input":
    "Conv1D 层需要且仅需要一个输入",
  "Conv2D layer requires 3D input (height, width, channels)":
    "Conv2D 层需要 3D 输入（height, width, channels）",
  "Conv2D layer requires exactly one input":
    "Conv2D 层需要且仅需要一个输入",
  "Conv2DTranspose layer requires 3D input (height, width, channels)":
    "Conv2DTranspose 层需要 3D 输入（height, width, channels）",
  "Conv2DTranspose layer requires exactly one input":
    "Conv2DTranspose 层需要且仅需要一个输入",
  "Cropping2D layer requires 3D input (height, width, channels)":
    "Cropping2D 层需要 3D 输入（height, width, channels）",
  "Cropping2D layer requires exactly one input":
    "Cropping2D 层需要且仅需要一个输入",
  "Dense layer requires exactly one input": "Dense 层需要且仅需要一个输入",
  "Dense layer requires input": "Dense 层需要输入",
  "Dense layer requires flat input (1D or 2D with batch dimension). Use Flatten layer before Dense for multi-dimensional inputs.":
    "Dense 层需要展平输入（1D 或带 batch 维的 2D）。对于多维输入，请先使用 Flatten 层。",
  "Dropout layer requires exactly one input": "Dropout 层需要且仅需要一个输入",
  "Embedding layer requires 1D (batch,) or 2D (batch, sequence_length) input":
    "Embedding 层需要 1D（batch,）或 2D（batch, sequence_length）输入",
  "Embedding layer requires exactly one input":
    "Embedding 层需要且仅需要一个输入",
  "Flatten layer requires exactly one input": "Flatten 层需要且仅需要一个输入",
  "GaussianNoise layer requires exactly one input":
    "GaussianNoise 层需要且仅需要一个输入",
  "GlobalAveragePooling2D layer requires 3D input (height, width, channels)":
    "GlobalAveragePooling2D 层需要 3D 输入（height, width, channels）",
  "GlobalAveragePooling2D layer requires exactly one input":
    "GlobalAveragePooling2D 层需要且仅需要一个输入",
  "GRU layer requires 2D input (sequence_length, features)":
    "GRU 层需要 2D 输入（sequence_length, features）",
  "GRU layer requires exactly one input": "GRU 层需要且仅需要一个输入",
  "LayerNormalization layer requires at least 1D input":
    "LayerNormalization 层至少需要 1D 输入",
  "LayerNormalization layer requires exactly one input":
    "LayerNormalization 层需要且仅需要一个输入",
  "LSTM layer requires 2D input (sequence_length, features)":
    "LSTM 层需要 2D 输入（sequence_length, features）",
  "LSTM layer requires exactly one input": "LSTM 层需要且仅需要一个输入",
  "MaxPool2D layer requires 3D input (height, width, channels)":
    "MaxPool2D 层需要 3D 输入（height, width, channels）",
  "MaxPool2D layer requires exactly one input":
    "MaxPool2D 层需要且仅需要一个输入",
  "Merge layer requires at least two inputs": "Merge 层至少需要两个输入",
  "Output layer requires exactly one input": "Output 层需要且仅需要一个输入",
  "Output layer requires flat input (1D or 2D with batch dimension)":
    "Output 层需要展平输入（1D 或带 batch 维的 2D）",
  "Permute layer requires exactly one input": "Permute 层需要且仅需要一个输入",
  "Reshape layer requires exactly one input": "Reshape 层需要且仅需要一个输入",
  "SeparableConv2D layer requires 3D input (height, width, channels)":
    "SeparableConv2D 层需要 3D 输入（height, width, channels）",
  "SeparableConv2D layer requires exactly one input":
    "SeparableConv2D 层需要且仅需要一个输入",
  "Shape Error: {shapeErrorMessage}": "形状错误：{shapeErrorMessage}",
  "SpatialDropout2D layer requires 3D input (height, width, channels)":
    "SpatialDropout2D 层需要 3D 输入（height, width, channels）",
  "SpatialDropout2D layer requires exactly one input":
    "SpatialDropout2D 层需要且仅需要一个输入",
  "TimeDistributed layer requires at least 2D input (time_steps, features...)":
    "TimeDistributed 层至少需要 2D 输入（time_steps, features...）",
  "TimeDistributed layer requires exactly one input":
    "TimeDistributed 层需要且仅需要一个输入",
  "ZeroPadding2D layer requires 3D input (height, width, channels)":
    "ZeroPadding2D 层需要 3D 输入（height, width, channels）",
  "ZeroPadding2D layer requires exactly one input":
    "ZeroPadding2D 层需要且仅需要一个输入",

  "Could not compute output shape for {type}": "无法计算 {type} 的输出形状",
  "Could not determine input shapes for {type}": "无法确定 {type} 的输入形状",
  "Error computing shape: {expr0}": "计算形状出错：{expr0}",
  "Input layer definition not found": "未找到 Input 层定义",
  "Invalid input for {type}": "{type} 的输入无效",
  "Invalid input shape: {inputShape}": "输入形状无效：{inputShape}",
  "{type} has no input connections": "{type} 没有输入连接",
  "Unknown error": "未知错误",
  "Unknown layer type: {type}": "未知层类型：{type}",
  "Network contains cycles - DAG structure required": "网络包含环路，需要 DAG 结构",
  "Network must have at least one Input layer": "网络至少需要一个 Input 层",
  "Network must have at least one layer": "网络至少需要一个层",
  "Network must have at least one Output layer": "网络至少需要一个 Output 层",
  "Node '{nodeId}' not found": "未找到节点 '{nodeId}'",

  "Apply a layer to every temporal slice of an input":
    "对输入的每个时间切片应用一个层",
  "This layer will be repeated {multiplier} times": "该层将重复 {multiplier} 次",
  "Select {expr0}": "选择 {expr0}",
  "Type of prediction task": "预测任务类型",
  "Type of layer to apply at each time step": "在每个时间步应用的层类型",
};

function loadJson(filePath: string): Messages {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as Messages;
}

function saveJson(filePath: string, data: Messages): void {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function translateByPattern(value: string): string | null {
  const patternRules: Array<[RegExp, (match: RegExpMatchArray) => string]> = [
    [
      /^(.+) layer requires exactly one input$/,
      (m) => `${m[1]} 层需要且仅需要一个输入`,
    ],
    [/^(.+) layer requires at least one input$/, (m) => `${m[1]} 层至少需要一个输入`],
    [/^(.+) layer requires at least two inputs$/, (m) => `${m[1]} 层至少需要两个输入`],
    [/^(.+) layer requires at least 1D input$/, (m) => `${m[1]} 层至少需要 1D 输入`],
    [/^(.+) layer requires at least 2D input \((.+)\)$/, (m) => `${m[1]} 层至少需要 2D 输入（${m[2]}）`],
    [/^(.+) layer requires 2D input \((.+)\)$/, (m) => `${m[1]} 层需要 2D 输入（${m[2]}）`],
    [/^(.+) layer requires 3D input \((.+)\)$/, (m) => `${m[1]} 层需要 3D 输入（${m[2]}）`],
    [/^(.+) layer for (.+)$/, (m) => `用于${m[2]}的 ${m[1]} 层`],
    [/^Number of (.+)$/, (m) => `${m[1]}数量`],
    [/^Size of (.+)$/, (m) => `${m[1]}大小`],
    [/^Length of (.+)$/, (m) => `${m[1]}长度`],
    [/^Type of (.+)$/, (m) => `${m[1]}类型`],
    [/^Fraction of (.+) to drop$/, (m) => `要丢弃的${m[1]}比例`],
    [/^Padding to (.+)$/, (m) => `用于${m[1]}的填充`],
    [/^Return (.+)$/, (m) => `返回${m[1]}`],
    [/^Element-wise (.+)$/, (m) => `逐元素${m[1]}`],
  ];

  for (const [pattern, formatter] of patternRules) {
    const match = value.match(pattern);
    if (match) return formatter(match);
  }

  return null;
}

function translateValue(key: string, value: string): string {
  if (EXACT_BY_KEY[key]) return EXACT_BY_KEY[key];
  if (EXACT_BY_VALUE[value]) return EXACT_BY_VALUE[value];
  if (KEEP_AS_IS.has(value)) return value;
  const byPattern = translateByPattern(value);
  if (byPattern) return byPattern;
  return "";
}

function main(): void {
  const enPath = path.join(REPO_ROOT, "tmp/i18n/messages.en.json");
  const zhPath = path.join(REPO_ROOT, "tmp/i18n/messages.zh-CN.json");

  const en = loadJson(enPath);
  const zhOut: Messages = {};

  const missingByValue = new Map<string, string[]>();

  for (const [key, value] of Object.entries(en)) {
    const translated = translateValue(key, value).trim();
    zhOut[key] = translated;
    if (!translated) {
      const keys = missingByValue.get(value) ?? [];
      keys.push(key);
      missingByValue.set(value, keys);
    }
  }

  saveJson(zhPath, zhOut);

  if (missingByValue.size > 0) {
    console.error(`Missing translations for ${missingByValue.size} unique values.`);
    for (const [value, keys] of missingByValue.entries()) {
      console.error(`- ${JSON.stringify(value)} :: ${keys.slice(0, 3).join(", ")}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(`i18n: filled ${Object.keys(zhOut).length} zh-CN entries`);
}

main();
