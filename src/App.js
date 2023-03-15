import "./App.css";
import { InfoCircleOutlined, StarFilled } from "@ant-design/icons";
import { useEffect, useState } from "react";

import {
  Space,
  Input,
  InputNumber,
  Form,
  Radio,
  Table,
  Typography,
  Row,
  Col,
} from "antd";

import doypacks from "./jsons/doypacks.json";
import dpmachines from "./jsons/dpmachines.json";
import handpacking from "./jsons/handpacking.json";
import jarmachines from "./jsons/jarmachines.json";
import jars from "./jsons/jars.json";
import mps from "./jsons/mps.json";
import mpmachines from "./jsons/mpmachines.json";
import singlemachines from "./jsons/singlemachines.json";
import singles from "./jsons/singles.json";

const App = () => {
  const columns = [
    {
      title: "Machines",
      dataIndex: "MACHINES",
      render(text, record) {
        return {
          props: {
            style: {
              background:
                record.mix_link === "Y"
                  ? "#537FE7"
                  : parseFloat(record.percentage) > 0.6
                  ? "#659864"
                  : "#D21345",
              color: "white",
              fontWeight: "bold",
            },
          },
          children: (
            <Row>
              <Col span={8}>
                <div style={{ fontSize: 18 }}>{text}</div>
              </Col>
              <Col span={7} offset={1} style={{ textAlign: "center" }}>
                {record.percentage > 0.6 ? (
                  <div>
                    Recommended{"\n"}
                    <StarFilled style={{ color: "yellow" }} />
                  </div>
                ) : record.mix_link === "Y" ? (
                  "Low Efficiency (Mix Link)"
                ) : (
                  "Low Efficiency"
                )}
              </Col>
            </Row>
          ),
        };
      },
    },
    {
      title: "Time",
      dataIndex: "time",
    },
    {
      title: "Headcount",
      dataIndex: "num_employees",
    },
  ];

  const [form] = Form.useForm();

  const [data, setData] = useState([]);

  const [inPalette, setInPalette] = useState(1);
  const [palette, setPalette] = useState(1);
  const [inBox, setInBox] = useState(1);

  const [title, setTitle] = useState("");

  const [status, setStatus] = useState("");

  const [enabled, setEnabled] = useState(false);

  const [inBoxEnabled, setInBoxEnabled] = useState(false);

  const [doypack, setDoypack] = useState([]);
  const [jar, setJar] = useState([]);
  const [single, setSingle] = useState([]);
  const [multipack, setMultipack] = useState([]);

  const [productCode, setProductCode] = useState("");

  const maxMinOptimization = (arr) => {
    const array = arr.map((item) => parseFloat(item));
    const min = Math.min(...array);
    const max = Math.max(...array);

    const temp = [];

    for (let i = 0; i < array.length; i++) {
      temp.push(((array[i] - min) / (max - min)) * 1.0);
    }
    return temp;
  };

  const sigmoid = (x) => {
    return 1 / (1 + Math.exp(-x));
  };

  useEffect(() => {
    onChangeProduct(productCode);
  }, [palette, inPalette, inBox]);

  const convertTime = (time) => {
    const hours = parseInt(time / 3600);
    const minutes = parseInt((time - hours * 3600) / 60);
    const seconds = (time - hours * 3600 - minutes * 60).toFixed(2);

    return hours == 0
      ? minutes == 0
        ? seconds + " secs"
        : minutes + " mins " + seconds + " secs"
      : hours + " hrs " + minutes + " mins " + seconds + " secs";
  };

  const searchDoypacks = (text) => {
    const res_dp = doypacks.map(
      ({
        Size,
        Ounces,
        product_code,
        product_name,
        in_box,
        avg_production,
        Class,
      }) => ({
        Size,
        Ounces,
        product_code,
        product_name,
        in_box,
        avg_production,
        Class,
      })
    );
    const res = res_dp.filter((item) => item.product_code === text);
    setDoypack(res);
    if (res.length == 1) {
      setEnabled(true);
      setTitle(res[0].product_name);
      form.setFieldValue("in_box", res[0].in_box);
      var selected_dps = dpmachines.filter((item) => {
        if (item.avg_production_speed === "") {
          return false;
        }
        if (item.Size === res[0].Size) {
          return true;
        }
      });

      const speeds = [];

      for (let i = 0; i < Object.keys(selected_dps).length; i++) {
        speeds.push(Object.values(selected_dps)[i].avg_production_speed);
      }

      const optimized = maxMinOptimization(speeds);
      const max = Math.max(
        ...Object.values(selected_dps).map((item) =>
          sigmoid(item.avg_production_speed)
        )
      );
      for (let i = 0; i < Object.keys(selected_dps).length; i++) {
        Object.values(selected_dps)[i]["percentage"] = optimized[i];
        var time =
          inPalette *
          palette *
          parseFloat(res[0].avg_production.replace(",", "."));
        time =
          time +
          time *
            (max -
              sigmoid(Object.values(selected_dps)[i].avg_production_speed));

        Object.values(selected_dps)[i]["time"] = convertTime(time);
      }

      selected_dps = Object.values(selected_dps).sort((a, b) => {
        return b.percentage - a.percentage;
      });
      setData(selected_dps);
    } else {
      setEnabled(false);
      setTitle("");
      setData([]);
      form.setFieldValue("in_palette", 1);
      form.setFieldValue("num_palette", 1);
      form.setFieldValue("in_box", "");
      setPalette(1);
      setInPalette(1);
    }
  };

  const searchJars = (text) => {
    const res = jars.filter((item) => item.product_code === text);
    setJar(res);
    if (res.length == 1) {
      setEnabled(true);
      setTitle(res[0].product_name);
      setInBoxEnabled(true);
      var selected_jars = jarmachines.filter((item) => {
        if (item.avg_production_speed === "") {
          return false;
        }
        if (item.Types === res[0].jar_type) {
          return true;
        }
      });
      const speeds = [];
      for (let i = 0; i < Object.keys(selected_jars).length; i++) {
        speeds.push(Object.values(selected_jars)[i].avg_production_speed);
      }
      const optimized = maxMinOptimization(speeds);
      for (let i = 0; i < Object.keys(selected_jars).length; i++) {
        Object.values(selected_jars)[i]["percentage"] = optimized[i];
        var time =
          (inPalette * palette * inBox) /
          parseFloat(selected_jars[i].avg_production_speed.replace(",", "."));

        Object.values(selected_jars)[i]["time"] = convertTime(time);
      }

      selected_jars = Object.values(selected_jars).sort((a, b) => {
        return b.percentage - a.percentage;
      });

      setData(selected_jars);
    } else {
      setEnabled(false);
      setInBoxEnabled(false);
      setTitle("");
      setData([]);
      form.setFieldValue("in_box", 1);
      form.setFieldValue("in_palette", 1);
      form.setFieldValue("num_palette", "1");
      setInBox(1);
      setPalette(1);
      setInPalette(1);
    }
  };

  const searchSingles = (text) => {
    const res = singles.filter((item) => item.product_code === text);
    setSingle(res);
    if (res.length == 1) {
      setEnabled(false);
      setTitle(res[0].product_name);
      setInBoxEnabled(true);

      var selected_singles = singlemachines;

      const speeds = [];
      for (let i = 0; i < Object.keys(selected_singles).length; i++) {
        speeds.push(Object.values(selected_singles)[i].avg_production_speed);
      }
      const optimized = maxMinOptimization(speeds);
      for (let i = 0; i < Object.keys(selected_singles).length; i++) {
        Object.values(selected_singles)[i]["percentage"] = optimized[i];
        var time =
          inBox /
          parseFloat(
            selected_singles[i].avg_production_speed.replace(",", ".")
          );

        Object.values(selected_singles)[i]["time"] = convertTime(time);
      }

      selected_singles = Object.values(selected_singles).sort((a, b) => {
        return b.percentage - a.percentage;
      });

      setData(selected_singles);
    } else {
      setEnabled(false);
      setInBoxEnabled(false);
      setTitle("");
      setData([]);
      form.setFieldValue("in_box", 1);
      form.setFieldValue("in_palette", 1);
      form.setFieldValue("num_palette", "1");
      setInBox(1);
      setPalette(1);
      setInPalette(1);
    }
  };

  const searchMultipacks = (text) => {
    const res = mps.filter((item) => item.product_code === text);
    setMultipack(res);
    if (res.length == 1) {
      setEnabled(true);
      setTitle(res[0].product_name);
      setInBoxEnabled(true);

      var selected_mps = mpmachines;

      const speeds = [];
      for (let i = 0; i < Object.keys(selected_mps).length; i++) {
        speeds.push(Object.values(selected_mps)[i].avg_production_speed);
      }
      const optimized = maxMinOptimization(speeds);
      for (let i = 0; i < Object.keys(selected_mps).length; i++) {
        Object.values(selected_mps)[i]["percentage"] = optimized[i];
        var time =
          (inPalette * palette * inBox) /
          parseFloat(selected_mps[i].avg_production_speed.replace(",", "."));

        Object.values(selected_mps)[i]["time"] = convertTime(time);
      }

      selected_mps = Object.values(selected_mps).sort((a, b) => {
        return b.percentage - a.percentage;
      });

      setData(selected_mps);
    } else {
      setEnabled(false);
      setInBoxEnabled(false);
      setTitle("");
      setData([]);
      form.setFieldValue("in_box", 1);
      form.setFieldValue("in_palette", 1);
      form.setFieldValue("num_palette", "1");
      setInBox(1);
      setPalette(1);
      setInPalette(1);
    }
  };

  const onChangeProduct = (e) => {
    const text = e;
    setProductCode(text);

    if (status === "dp") {
      searchDoypacks(text);
      setInBoxEnabled(false);
    } else if (status === "jar") {
      searchJars(text);
    } else if (status === "sng") {
      searchSingles(text);
    } else if (status === "mp") {
      searchMultipacks(text);
    }
  };

  return (
    <Form form={form} layout="vertical">
      <Form.Item label="">
        <Radio.Group
          onChange={(e) => {
            setStatus(e.target.id);
            setData([]);
            setTitle("");
            form.resetFields();
            setEnabled(false);
          }}
        >
          <Radio.Button value="multipack" id="mp">
            Multipack
          </Radio.Button>
          <Radio.Button value="handpacking" id="hp" disabled>
            Handpacking
          </Radio.Button>
          <Radio.Button value="jar" id="jar">
            Jar
          </Radio.Button>
          <Radio.Button value="doypack" id="dp">
            Doypack
          </Radio.Button>
          <Radio.Button value="single" id="sng">
            Single
          </Radio.Button>
        </Radio.Group>
      </Form.Item>
      <Form.Item
        label="Product Code"
        name="produkt"
        required
        tooltip="Code of the product."
        style={{ width: 500 }}
        rules={[
          {
            validator: (_, value) => {
              if (status === "") {
                return Promise.reject("You should enter the category!");
              } else if (
                doypack.length != 1 &&
                jar.length != 1 &&
                single.length != 1 &&
                multipack.length != 1
              ) {
                return Promise.reject("No product found!");
              } else {
                return Promise.resolve();
              }
            },
          },
        ]}
      >
        <Input
          placeholder=""
          onChange={(e) => onChangeProduct(e.target.value)}
        />
      </Form.Item>
      <Form.Item
        label="In Box"
        name="in_box"
        required
        tooltip="How many products are there in a box?"
      >
        <InputNumber
          placeholder=""
          min={1}
          disabled={!inBoxEnabled}
          style={{ width: 500 }}
          onChange={(value) => setInBox(value)}
        />
      </Form.Item>
      <Form.Item
        label="In Pallet"
        name="in_palette"
        required
        tooltip="How many boxes are there in a pallet?"
      >
        <InputNumber
          placeholder=""
          min={1}
          disabled={!enabled}
          style={{ width: 500 }}
          onChange={(value) => setInPalette(value)}
        />
      </Form.Item>
      <Space direction="vertical" size={16}></Space>
      <Form.Item
        label="Number of Pallets"
        name="num_palette"
        tooltip={{
          title: "How many pallets do you want to produce?",
          icon: <InfoCircleOutlined />,
        }}
      >
        <InputNumber
          placeholder=""
          min={1}
          disabled={!enabled}
          style={{ width: 500 }}
          onChange={(value) => setPalette(value)}
        />
      </Form.Item>
      <div
        style={{
          margin: "auto",
          border: "solid",
          borderWidth: "0px",
          borderRadius: "20px",
          backgroundColor: "#379237",
          width: title.length * 24,
        }}
      >
        <Typography.Title
          level={1}
          style={{
            textAlign: "center",
            color: "#FFFBF5",
          }}
        >
          {title}
        </Typography.Title>
      </div>
      <Table columns={columns} dataSource={data} />;
    </Form>
  );
};
export default App;
